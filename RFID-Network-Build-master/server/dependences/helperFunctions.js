/*
 * Ben Duggan
 * 11/6/18
 * Server helper function
 */

const os = require('os');

module.exports.initialize = function() {
  /*** START - Setup data ***/
  /// Set up system variables
  // Load data into RFID and rfidrCounts and readerCounts system variable
  queryDB("SELECT * FROM birds").then(function(resolve) {
    for(var i=0; i<resolve.length; i++) {
      RFIDList.push(resolve[i].rfidTag);
      RFIDBandMap[resolve[i].rfidTag] = resolve[i].bandID;
      RFIDBandMap[resolve[i].bandID] = resolve[i].rfidTag;
      if(resolve[i].bandID == "" || resolve[i].bandID == "unknown" || resolve[i].bandID == null) {
        RFIDSexMap[null] = null;
      }
      else {
        RFIDSexMap[resolve[i].bandID] = resolve[i].sex;
      }
    }
  }).catch(function(reject) {
    logger.error(reject);
    io.emit('errorMessage', {"level":"error","message":reject});
  });

  // Load data into reader system variable
  queryDB("SELECT * FROM boxes").then(function(resolve) {
    fieldSitesList.push("NULL"); //Initialize fieldSites

    for(var i=0; i<resolve.length; i++) {
      readersList.push(resolve[i].reader);
      readersBoxMap[resolve[i].reader] = resolve[i].box;

      // Add fieldSites
      if(!fieldSitesList.includes(resolve[i].fieldSite)) {
        fieldSitesList.push(resolve[i].fieldSite);
      }
    }
  }).catch(function(reject) {
    logger.error(reject);
    io.emit('errorMessage', {"level":"error","message":reject});
  });
  /*** END - Setup data ***/


  // Start the services if they are being ran on a RPi
  if(settings.serverType == "fieldSite" && false) {
    // Set up hotspot
    setTimeout(function() {
      exec('sh ' + __dirname + '/beginAP.sh', (err, stdout, stderr) => {
        if(err) {
          logger.error(reject);
          io.emit('errorMessage', {"level":"error","message":reject});
          return;
        }
      });
    }, 10000);
  }

  // Check to see if the log file needs to be removed at start
  if(settings.newLogOnStart) {
    fs.unlink("log.log", (err) => {
      if (err) {
        logger.error(err);
        io.emit('errorMessage', {"level":"error","message":err});
      }
    });
  }
}


/*** START - Helper functions ***/
Date.prototype.toSQLString = function() {
    var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        ' ' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds());
}


// Deal with logging and alerting to errors
global.errorHandle = function(err) {
  console.log("Depriciated: ")
  console.error(err);
  io.emit('errorMessage', {"level":"error","message":err});
  logger.error(err);
}

global.logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'silly',
    	 format: winston.format.combine(
    		 winston.format.timestamp(),
			   winston.format.colorize({ all: true }),
		     winston.format.simple()
		   )
    }),
    new winston.transports.File({
      filename: 'logs.log',
      level: 'info',
      format: winston.format.combine(
			  winston.format.timestamp(),
        winston.format.json()
		  )
    })
  ]
});

// Function for easily creating sync mysql requests
global.queryDB = function(query, passBack=null, multiStatements=false) {
  console.log(query);
  return new Promise(function(resolve, reject) {
    let con = mysql.createConnection({host: sqlKey.host, user: sqlKey.user, password: sqlKey.password, database: sqlKey.database, multipleStatements: multiStatements});
    con.connect(function(err) {
        if (err) {
            console.error(err);
            con.end();
            reject(passBack==null ? err : {"err":err, "passBack":passBack});
        }
        else {
            con.query(query, function (err, result, fields) {
                 if (err) {
                   console.error(err);
                   con.end();
                   reject(passBack==null ? err : {"err":err, "passBack":passBack});
                 }
                 else {
                   con.end();
                   resolve(passBack==null ? result : {"result":result, "passBack":passBack});
                 }
            });
        }
    });
  });
}

// Class that helps with formating the WHERE clause in the SQL subsetting operations
global.sqlSubset = class {
  static sqlFromArray(variable, data) {
    let sqlQuery = '';
    for(var i=0; i<data.length; i++) {
      if(i > 0) {
          sqlQuery += " OR "+variable+"='"+data[i]+"'";
      }
      else {
          sqlQuery += " ("+variable+"='"+data[i]+"'";
      }
    }
    if(sqlQuery.length > 0) {
      sqlQuery += ")";
    }
    return sqlQuery;
  }

  static generateWhereQuery(data) {
    let sqlQuery = "";
    let temp = "";

    // RFID and bandID filter
    if(data.rfid) {
      for(var c in data.band) {
        if(data.rfid) {
          data.rfid.push(RFIDBandMap[data.band[c]]);
        }
        else {
          data.rfid = [RFIDBandMap[data.band[c]]];
        }
      }
        sqlQuery += sqlSubset.sqlFromArray("rfid", data.rfid);
    }
    //Box filter
    if(data.box) {
      temp = sqlSubset.sqlFromArray("box", data.box);
      if(sqlQuery.length > 0) {
        sqlQuery += " AND" + temp;
      }
      else {
        sqlQuery += temp;
      }
    }
    //Reader filter
    if(data.reader) {
      temp = sqlSubset.sqlFromArray("reader", data.reader);
      if(sqlQuery.length > 0) {
        sqlQuery += " AND" + temp;
      }
      else {
        sqlQuery += temp;
      }
    }
    // Date filters
    if(data.startDate && data.endDate) {
      if(sqlQuery.length > 0) {
        sqlQuery += " AND (datetime BETWEEN '"+data.startDate+"' and '"+data.endDate+"')";
      }
      else {
        sqlQuery += " (datetime BETWEEN '"+data.startDate+"' and '"+data.endDate+"')";
      }
    }

    // add where clause if needed
    if(sqlQuery.length > 0) {
      sqlQuery = " WHERE" + sqlQuery
    }

    return sqlQuery
  }

  static generateWhereQueryGivenRFID(data, rfid) {
    let sqlQuery = "";
    let temp = "";

    sqlQuery += " rfid='"+rfid+"'";

    //Box filter
    if(data.box) {
      temp = sqlSubset.sqlFromArray("box", data.box);
      if(sqlQuery.length > 0) {
        sqlQuery += " AND" + temp;
      }
      else {
        sqlQuery += temp;
      }
    }
    //Reader filter
    if(data.reader) {
      temp = sqlSubset.sqlFromArray("reader", data.reader);
      if(sqlQuery.length > 0) {
        sqlQuery += " AND" + temp;
      }
      else {
        sqlQuery += temp;
      }
    }
    // Date filters
    if(data.startDate && data.endDate) {
      if(sqlQuery.length > 0) {
        sqlQuery += " AND (datetime BETWEEN '"+data.startDate+"' and '"+data.endDate+"')";
      }
      else {
        sqlQuery += " (datetime BETWEEN '"+data.startDate+"' and '"+data.endDate+"')";
      }
    }

    // add where clause if needed
    if(sqlQuery.length > 0) {
      sqlQuery = " WHERE" + sqlQuery
    }

    return sqlQuery
  }
}
/*** END - Helper functions ***/

// Save tables as csv
module.exports.saveTablesToCSV = function() {
  exec('rm ' +process.cwd() + '/outputCSV/*.zip /var/lib/mysql/csv/*.csv', (err, stdout, stderr) => {
    if(err) {
      //errorHandle(err);
      // This is used just in case but will through a non fatal error.  Don't want to catch it
      return;
    }
  });

  var numberFinished = 0;
  function moveAndZip() {
    if(numberFinished < 3) {
      return;
    }
    numberFinished = 0;

    var fileName = 'RFIDNetworkData'+new Date().toISOString()+'.zip';
    exec('cd /var/lib/mysql/csv/; zip '+process.cwd()+'/outputCSV/'+fileName+' ./*.csv', (err, stdout, stderr) => {
      if(err) {
        logger.error(err);
        io.emit('errorMessage', {"level":"error","message":err});
        return;
      }
      io.emit('saveData-client', {"data":fileName});
      exec('rm /var/lib/mysql/csv/*.csv', (err, stdout, stderr) => {
        if(err) {
          logger.error(err);
          io.emit('errorMessage', {"level":"error","message":err});
          return;
        }
      });
    });
  }

  queryDB("SELECT 'rfidTag', 'bandID', 'sex', 'age', 'taggedDateTime', 'taggedLocation', 'comment' UNION ALL SELECT * INTO OUTFILE '/var/lib/mysql/csv/birds.csv' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' LINES TERMINATED BY '\n' FROM birds").then(function(resolve) {
    numberFinished++;
    moveAndZip();
  }).catch(function(reject) {
    logger.error(reject);
    io.emit('errorMessage', {"level":"error","message":reject});
  });
  queryDB("SELECT * INTO OUTFILE '/var/lib/mysql/csv/boxes.csv' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' LINES TERMINATED BY '\n' FROM boxes").then(function(resolve) {
    numberFinished++;
    moveAndZip();
  }).catch(function(reject) {
    logger.error(reject);
    io.emit('errorMessage', {"level":"error","message":reject});
  });
  queryDB("SELECT * INTO OUTFILE '/var/lib/mysql/csv/reads.csv' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '\"' LINES TERMINATED BY '\n' FROM readerdata").then(function(resolve) {
    numberFinished++;
    moveAndZip();
  }).catch(function(reject) {
    logger.error(reject);
    io.emit('errorMessage', {"level":"error","message":reject});
  });
}

// Calcualte average cpu usage
function cpuUsage() {
  let total = 0;
  let idle = 0;
  let cpus = os.cpus();
  for(let i=0; i<cpus.length; i++) {
    total += cpus[i]['times']['user'] + cpus[i]['times']['nice'] + cpus[i]['times']['sys'] + cpus[i]['times']['idle'] + cpus[i]['times']['irq'];
    idle += cpus[i]['times']['idle'];
  }

  return {'idle':idle, 'total':total};
}

var initialCpuUsage = cpuUsage();

// System stats
module.exports.systemStats = function() {
  let stats = {};
  stats['arch'] = os.arch();
  stats['totalMemory'] = os.totalmem();
  stats['freeMemory'] = os.freemem();
  stats['os'] = os.type();
  stats['upTime'] = os.uptime();

  let currCpuUsage = cpuUsage();
  stats['cpuPercent'] = (( (currCpuUsage['total']-initialCpuUsage['total']) - (currCpuUsage['idle']-initialCpuUsage['idle'])) /(currCpuUsage['total']-initialCpuUsage['total'])) * 100;
  initialCpuUsage = currCpuUsage;

  stats['time'] = new Date();
  stats['timezone'] = /\((.*)\)/.exec(new Date().toString())[1];

  return stats
}
