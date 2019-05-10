/*
 * Ben Duggan
 * 12/31/18
 * Node.js servre for RFIDNetwork
 */

/*** START - Load Dependences ***/
global.express = require('express'); //Easy way to interface with webpages
global.app = express(); //Initiate express
global.server = require('http').createServer(app); //Express erver
global.io = require('socket.io').listen(server); //socket.io for live and esy communication between client and server
global.mysql = require('mysql'); //easy communication with mysql database
//global.inbox = require('nodemailer'); //access to the system email server
global.fs = require('fs');
global.exec = require('child_process').exec;
global.winston = require('winston');
/*** END - Load Dependences ***/

/*** START - app variables ***/
global.settings = JSON.parse(fs.readFileSync("settings.json"));
global.RFIDBandMap = {}; //Contains all the bandIDs for each RFID
global.RFIDList = []; //Contains the list of all RFIDs
global.RFIDSexMap = {}; //Contains the sex assignment of each bandID
global.readersBoxMap = {}; //Contains all the boxes for each readerID
global.readersList = []; //Contains all the readerIDs
global.fieldSitesList = []; //Contains all the fieldSites on the system
global.sqlKey = settings.mysql;
global.hf = require('./dependences/helperFunctions');
/*** END - app variables ***/

hf.initialize();
// Load radio dependences if they are present/usable
if(settings.radio.enable) {
  var radio = require('./radio');

  setTimeout(function(){radio.begin();}, 10000);
}

server.listen(process.env.PORT || 4000, function() {
  logger.info('Server is running on port: ' + server.address().port);
}); //Start the server

/*** START - User authentification ***/
if(settings.system_type != 'test') {
  // Check if this is a page any user can see
  app.use((req, res, next) => {
    // https://stackoverflow.com/questions/23616371/basic-http-authentication-with-node-and-express-4
    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = new Buffer(b64auth, 'base64').toString().split(':');

    // Authenticate that admin and user have access
    // Verify login and password are set and correct
    if ((!login || !password || login !== settings.users.admin.username || password !== settings.users.admin.password) && (!login || !password || login !== settings.users.user.username || password !== settings.users.user.password)) {
      res.set('WWW-Authenticate', 'Basic realm="401"') // change this
      res.status(401).send('Authentication required.') // custom message
      return;
    }

    // Check to see if requested url is in the path list requiring admin credentials
    console.log(req.url);
    if(settings.adminAccessPages.includes(req.url)) {
      console.log('checking admin creds');
      // Check to see if admin creds are correct
      // Verify login and password are set and correct
      if (!login || !password || login !== settings.users.admin.username || password !== settings.users.admin.password) {
        res.set('WWW-Authenticate', 'Basic realm="401"') // change this
        res.status(401).send('Authentication required.  You don\' have access.  You are logged in as a user not an admin.') // custom message
        console.log('not allowed');
        return;
      }
    }

    // Check to see if requested url is of the form secure/settings.html?delete=______
    if(req.query.hasOwnProperty("delete")) {
      // Check to see if admin creds are correct
      // Verify login and password are set and correct
      if (!login || !password || login !== settings.users.admin.username || password !== settings.users.admin.password) {
        res.set('WWW-Authenticate', 'Basic realm="401"') // change this
        res.status(401).send('Authentication required.  You don\' have access.  You are logged in as a user not an admin.') // custom message
        return;
      }

      // Remove data in birds db
      if(req.query["delete"] == "birds" || req.query["delete"] == "all") {
        queryDB("DELETE FROM birds").then(function(resolve) {
          logger.warn("Deleted data from birds database.");
        }).catch(function(reject) {
          logger.error(reject);
          io.emit('errorMessage', {"level":"error","message":reject});
        });
      }
      // Remove data in boxes db
      if(req.query["delete"] == "readers" || req.query["delete"] == "all") {
        queryDB("DELETE FROM boxes").then(function(resolve) {
          logger.warn("Deleted data from readers database.");
        }).catch(function(reject) {
          logger.error(reject);
          io.emit('errorMessage', {"level":"error","message":reject});
        });
      }
      // Remove data in readerdata db
      if(req.query["delete"] == "readerdata" || req.query["delete"] == "all") {
        queryDB("DELETE FROM readerdata").then(function(resolve) {
          logger.warn("Deleted data from readerdata database.");
        }).catch(function(reject) {
          logger.error(reject);
          io.emit('errorMessage', {"level":"error","message":reject});
        });
      }
      // Remove data in log file
      if(req.query["delete"] == "log") {
        fs.writeFile("logs.log", "", function(err) {
        if (err) {
          logger.error(err);
          io.emit('errorMessage', {"level":"error","message":err});
        }

        logger.warn('log file emptied.');

        }); 
      }
    }

    // Access granted...
    next();    
  });
}
// Default load option and load all assets not explicitly included
app.use(express.static(__dirname + '/')); //Load all files and assets
/*** END - User authentification ***/


/*** START - SOCKETS ***/
io.on('connection', function (socket) {
  /*** START - System sockets ***/
  // Return the system variables
  socket.on('getSystemsVariables', function(data) {
    socket.emit('systemsVariables', {"RFIDList":RFIDList, "RFIDBandMap":RFIDBandMap, "RFIDSexMap":RFIDSexMap, "readersList":readersList, "readersBoxMap":readersBoxMap, "fieldSitesList":fieldSitesList});
  });
  /*** END - System sockets ***/

  /* START - BIRD SOCKETS */
  // Send user the table
  socket.on('bird-getDBRow', function(data) {
    queryDB("SELECT * FROM birds" + (data.id==undefined ? "" : " WHERE rfidTag='"+data.id+"'")).then(function(resolve) {
      socket.emit('bird-dbRow', {success: true, content:resolve});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Insert entry into table
  socket.on('bird-newEntry', function(data) {
    queryDB("INSERT INTO birds (rfidTag, bandID, sex, age, taggedDateTime, taggedLocation, comment) VALUES ('"+data.rfidTag+"','"+data.bandID+"','"+data.sex+"', '"+data.age+"','"+data.taggedDateTime+"','"+data.taggedLocation+"','"+data.comment+"')").then(function(resolve) {
      socket.emit('bird-entryResponce', {success: true, message: "Success!", content:data});
      RFIDList.push(data.rfidTag);
      RFIDBandMap[data.rfidTag] = data.bandID;
      RFIDBandMap[data.bandID] = data.rfidTag;
      RFIDSexMap[data.rfidTag] = data.sex;
      io.emit('systemsVariables', {"RFIDList":RFIDList, "RFIDBandMap":RFIDBandMap, "readersList":readersList, "readersBoxMap":readersBoxMap});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Edit entry from table
  socket.on('bird-editEntry', function(data) {
    queryDB("UPDATE birds SET bandID='"+data.bandID+"', rfidTag='"+data.rfidTag+"', sex='"+data.sex+"', age='"+data.age+"', taggedDateTime='"+data.taggedDateTime+"', taggedLocation='"+data.taggedLocation+"', comment='"+data.comment+"' WHERE rfidTag='"+data.originalRFIDTag+"'").then(function(resolve) {
      socket.emit('bird-editResponce', {success: true, message: "Success!", content:data});
      RFIDList.pop(data.originalRFIDTag);
      RFIDList.push(data.rfidTag);
      delete RFIDBandMap[data.rfidTag];
      delete RFIDBandMap[data.bandID];
      delete RFIDSexMap[data.rfidTag];
      RFIDBandMap[data.rfidTag] = data.bandID;
      RFIDBandMap[data.bandID] = data.rfidTag;
      RFIDSexMap[data.rfidTag] = data.sex;
      io.emit('systemsVariables', {"RFIDList":RFIDList, "RFIDBandMap":RFIDBandMap, "readersList":readersList, "readersBoxMap":readersBoxMap});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Delete entry from table
  socket.on('bird-deleteEntry', function(data) {
    queryDB("DELETE FROM birds WHERE rfidTag='"+data.rfid+"'").then(function(resolve) {
      socket.emit('bird-deleteResponce', {success: true, message: "Success!"});
      RFIDList.pop(data.rfidTag);
      delete RFIDBandMap[data.rfidTag];
      delete RFIDBandMap[data.bandID];
      delete RFIDSexMap[data.rfidTag];
      io.emit('systemsVariables', {"RFIDList":RFIDList, "RFIDBandMap":RFIDBandMap, "readersList":readersList, "readersBoxMap":readersBoxMap});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Get the last locations of each bird
  socket.on('bird-lastLocation', function(data) {
    for(let i=0; i<RFIDList.length; i++) {
      queryDB("SELECT *, MAX(datetime) FROM readerdata WHERE rfid='"+RFIDList[i]+"'").then(function(resolve) {
        socket.emit('bird-lastLocationResponse', {data: resolve});
      }).catch(function(reject) {
        logger.error(reject);
        io.emit('errorMessage', {"level":"error","message":reject});
      });
    }
  });
  /* END - BIRD SOCKETS */

  /* START - BOX SOCKETS */
  // Send user the table
  socket.on('box-getDBRow', function(data) {
    queryDB("SELECT * FROM boxes" + (data.reader==undefined ? "" : " WHERE reader='"+data.reader+"'")).then(function(resolve) {
      socket.emit('box-dbRow', {success: true, content:resolve});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Insert entry into table
  socket.on('box-newEntry', function(data) {
    queryDB("INSERT INTO boxes (box, reader, fieldSite, lat, lon, taggedDateTime, comment, currentDraw, currentSupply) VALUES ('"+data.box+"','"+data.reader+"', '"+data.fieldSite+"', '"+data.lat+"', '"+data.lon+"','"+data.taggedDateTime+"','"+data.comment+"','"+data.currentDraw+"','"+data.currentSupply+"')").then(function(resolve) {
      socket.emit('box-entryResponce', {success: true, message: "Success!", content:data});
      readersList.push(data.reader);
      readersBoxMap[data.reader] = data.box;
      readersBoxMap[data.box] = data.reader;
      io.emit('systemsVariables', {"RFIDList":RFIDList, "RFIDBandMap":RFIDBandMap, "readersList":readersList, "readersBoxMap":readersBoxMap});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Edit entry from table
  socket.on('box-editEntry', function(data) {
    queryDB("UPDATE boxes SET reader='"+data.reader+"', box='"+data.box+"', fieldSite='"+data.fieldSite+"', lat='"+data.lat+"', lon='"+data.lon+"', taggedDateTime='"+data.taggedDateTime+"', comment='"+data.comment+"', currentDraw='"+data.currentDraw+"', currentSupply='"+data.currentSupply+"' WHERE reader='"+data.originalReader+"'").then(function(resolve) {
      socket.emit('box-editResponce', {success: true, message: "Success!", content:data});
      readersList.pop(data.reader);
      readersList.push(data.reader);
      readersBoxMap[data.reader] = data.box;
      readersBoxMap[data.box] = data.reader;
      io.emit('systemsVariables', {"RFIDList":RFIDList, "RFIDBandMap":RFIDBandMap, "readersList":readersList, "readersBoxMap":readersBoxMap});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Delete entry from table
  socket.on('box-deleteEntry', function(data) {
    queryDB("DELETE FROM boxes WHERE reader='"+data.reader+"'").then(function(resolve) {
      socket.emit('box-deleteResponce', {success: true, message: "Success!"});
      readersList.pop(data.reader);
      delete readersBoxMap[data.reader];
      delete readersBoxMap[data.box];
      io.emit('systemsVariables', {"RFIDList":RFIDList, "RFIDBandMap":RFIDBandMap, "readersList":readersList, "readersBoxMap":readersBoxMap});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Get the last bird of each reader
  socket.on('box-lastBird', function(data) {
    for(let i=0; i<readersList.length; i++) {
      queryDB("SELECT *, MAX(datetime) FROM readerdata WHERE reader='"+readersList[i]+"'").then(function(resolve) {
        socket.emit('box-lastBirdResponse', {data: resolve});
      }).catch(function(reject) {
        logger.error(reject);
        io.emit('errorMessage', {"level":"error","message":reject});
      });
    }
  });
  /* END - BOX SOCKETS */

  /*** START - Reads Viewer ***/
  // Get all the reads and send them to the readViewer
  socket.on('rv-getReadsTable', function(data) {
    if(data["maxReads"] == NaN || data["maxReads"] == null || data["maxReads"].toString().length == 0) {
      data["maxReads"] = 500;
    }
    queryDB("(SELECT * FROM readerdata" + sqlSubset.generateWhereQuery(data["filter"]) + " ORDER BY datetime DESC LIMIT " + data["maxReads"] + ") ORDER BY datetime ASC").then(function(resolve) {
      socket.emit('rv-readsTable', {success: true, content:resolve});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Return the number of entries for the given filter
  socket.on('rv-getNumberOfEntries', function(data) {
    queryDB("SELECT COUNT(rfid) FROM readerdata" + sqlSubset.generateWhereQuery(data)).then(function(resolve) {
      socket.emit('rv-numberOfEntries', {success: true, content:resolve});
    }).catch(function(reject) {
      logger.error(reject);
      io.emit('errorMessage', {"level":"error","message":reject});
    });
  });

  // Returns the rfidCounts and rfidreaderCounts
  socket.on('rv-getCounts', function(data) {
    let rfidCounts = {}; //This holds the number of entries for each rfid-reader combination
    let readerCounts = {}; //This holds the nubmer of entries for each reader-rfid combination

    for(var c in data.band) {
      if(data.rfid) {
        data.rfid.push(RFIDBandMap[data.band[c]]);
      }
      else {
        data.rfid = [RFIDBandMap[data.band[c]]];
      }
    }

    if(!data.rfid) {
      data.rfid = RFIDList;
    }

    // Load rfidCounts and readerCounts system variables
    for(var i in data.rfid) {
      queryDB("SELECT DISTINCT reader FROM readerdata " + sqlSubset.generateWhereQueryGivenRFID(data, data.rfid[i]), data.rfid[i]).then(function(resolve) {
        for(var j in resolve.result) {
          queryDB("SELECT COUNT(rfid) FROM readerdata WHERE rfid='"+resolve.passBack+"' AND reader='"+resolve.result[j].reader+"'"+(data.startDate ?  "AND (datetime BETWEEN '"+data.startDate+"' and '"+data.endDate+"')" : ""), [resolve.passBack,resolve.result[j].reader]).then(function(resolve2) {
            // Is there an initial entry in the rfidCounts list?
            if(rfidCounts[resolve2.passBack[0]]) {
              rfidCounts[resolve2.passBack[0]][resolve2.passBack[1]] = resolve2.result[0]['COUNT(rfid)'];
            }
            else {
              rfidCounts[resolve2.passBack[0]] = {[resolve2.passBack[1]] : resolve2.result[0]['COUNT(rfid)']};
            }

            // Is there an initial entry in the readerCounts list?
            if(readerCounts[resolve2.passBack[1]]) {
              readerCounts[resolve2.passBack[1]][resolve2.passBack[0]] = resolve2.result[0]['COUNT(rfid)'];
            }
            else {
              readerCounts[resolve2.passBack[1]] = {[resolve2.passBack[0]] : resolve2.result[0]['COUNT(rfid)']};
            }
          }).catch(function(reject2) {
            logger.error(reject2.err);
            io.emit('errorMessage', {"level":"error","message":reject2.err});
            reject(reject2.err);
          });
        }
      }).catch(function(reject) {
        logger.error(reject.err);
        io.emit('errorMessage', {"level":"error","message":reject.err});
        reject(reject.err);
      });
    }

    //TODO: Turn the function above into a promise
    setTimeout(function() {
        socket.emit('rv-counts', {"rfidCounts":rfidCounts, "readerCounts":readerCounts});
    }, 1000);
  });
  /* END - Readsx Viewer */

  socket.on('saveData-server', function(data) {
    console.log(data);
    switch(data.type) {
      case "fileName":
        // Get the current zip file name
        fs.readdir(__dirname+"/outputCSV/", function(err, files) {
          if(err) {
            logger.error(err);
            io.emit('errorMessage', {"level":"error","message":err});
          }

          for(var i=0; i<files.length; i++) {
            if(files[i].includes(".zip")) {
              socket.emit('saveData-client', {"data":files[i]});
              return;
            }
          }
        });
        break;
      case "updateZIP":
        hf.saveTablesToCSV();
        break;
   }
  });

  // Get system status
  socket.on('settings-systemStats', function(data) {
    socket.emit('settings-systemStatsData', hf.systemStats());
  });

  // Shutdown/reboot the system
  socket.on('settings-shutdownRestart', function(data) {
    if(data.data === 'reboot') {
      logger.warn('System is rebooting.');
      exec('sudo reboot', function(err, stdout, stderr){if(err){logger.error('Couldn\' reboot: ' + err)}});
    }
    if(data.data === 'shutdown') {
      logger.warn('System is shuting down.');
      exec('sudo shutdown -h now', function(err, stdout, stderr){if(err){logger.error('Couldn\' shutdown: ' + err)}});
    }
  });

  // Get settings
  socket.on('settings-getSystemSettings', function(data) {
    socket.emit('settings-systemSettings', settings);
  });

  // Save system settings
  socket.on('settings-save', function(data) {
    oldSettings = JSON.parse(JSON.stringify(settings));

    // System name
    if(data.system_name) {
      logger.info('Changed system name to: ' + data.system_name);
      settings.system_name = data.system_name;      
    }

    // System type
    if(data.system_type != undefined) {
      if(data.system_type) {
        logger.info('Changed system type to: FieldSite');
        settings.system_type = 'FieldSite';
      }
      else {
        logger.info('Changed system type to: other');
        settings.system_type = 'other';
      }
    } 

    // AP
    if(data.ap) {
      // Save log
      logger.info('Changing access point SSID to \'' + data.ap.ssid + '\' and passphrase to \'' + data.ap.passphrase + '\'');
      // Save updated settings to local copy
      settings.wireless.ap.ssid = data.ap.ssid;
      settings.wireless.ap.passphrase = data.ap.passphrase;
      // Update /etc/hostapd/hostapd.conf 
      exec("sudo sed -i 's/ssid=.*/ssid="+data.ap.ssid+"/' /etc/hostapd/hostapd.conf && sudo sed -i 's/wpa_passphrase=.*/wpa_passphrase="+data.ap.passphrase+"/' /etc/hostapd/hostapd.conf", (err, stdout, stderr) => {
        if (err) {logger.error('Coundn\'t change access point settings: ' + err);}
      });
      if(settings.wireless.apOn) {
        logger.info('Restarting access point (hostapd).');
        exec("sudo service hostapd restart", (err, stdout, stderr) => {
          if (err) {logger.error('Coundn\'t restart hostapd: ' + err);}
        });
      }
    }

    // Wifi
    if(data.wifi) {
      // Save log
      logger.info('Changing wifi SSID to \'' + data.wifi.ssid + '\' and passphrase to \'' + data.wifi.passphrase + '\'');
      // Save updated settings to local copy
      settings.wireless.wifi.ssid = data.wifi.ssid;
      settings.wireless.wifi.passphrase = data.wifi.passphrase;
      // Update /etc/wpa_supplicant/wpa_supplicant.conf
      // Get file
      fs.readFile('/etc/wpa_supplicant/wpa_supplicant.conf', function read(err, data) {
           if (err) {logger.error(err); return;}
           var fileContent = data.toString();

           // See if previous wifi parameters are in it, if so replace it, if not add a new line
          if(fileContent.includes('ssid="'+oldSettings.wireless.wifi.ssid+'"') && fileContent.includes('psk="'+oldSettings.wireless.wifi.passphrase+'"')) {
            filecontent = fileContent.replace('ssid="'+oldSettings.wireless.wifi.ssid+'"', 'ssid="'+settings.wireless.wifi.ssid+'"');
            fileContent = fileContent.replace('psk="'+oldSettings.wireless.wifi.passphrase+'"', 'psk="'+settings.wireless.wifi.passphrase+'"');
          }
          else {
            fileContent += '\nnetwork={\n\tssid="'+settings.wireless.wifi.ssid+'" \n\tpsk="'+settings.wireless.wifi.passphrase+'"\n\tkey_mgmt=WPA-PSK\n}';
          }

          // Save new wireless file
          fs.writeFile('/etc/wpa_supplicant/wpa_supplicant.conf', fileContent, function(err, data){
              if (err) {logger.error(err); return;}
          });
          if(!settings.wireless.apOn) {
            logger.info('Restarting wifi.');
            exec("sudo wpa_cli -i wlan0 reconfigure", (err, stdout, stderr) => {
              if (err) {logger.error('Coundn\'t restart wifi: ' + err);}
            });
          }
       });      
    }

    // Enable radio
    if(data.radioEnable != undefined) {
      if(data.radioEnable) {
        if(!oldSettings.radio.enable) {
          settings.radio.enable = true;
          logger.warn('System is rebooting.');
          exec('sudo reboot', function(err, stdout, stderr){if(err){logger.error('Couldn\' reboot: ' + err)}});
        }
      }
      else {
        if(oldSettings.radio.enable) {
          settings.radio.enable = false;
          logger.warn('System is rebooting.');
          exec('sudo reboot', function(err, stdout, stderr){if(err){logger.error('Couldn\' reboot: ' + err)}});
        }
      }
    }

    // Radio settings
    if(data.radio) {
      logger.info('Changing radio settings.');
      settings.radio.ce = data.radio.ce;
      settings.radio.csn = data.radio.csn;
      settings.radio.channel = data.radio.channel;
      settings.radio.data_rate = data.radio.dataRate;
      settings.radio.PA_level = data.radio.paLevel;

      logger.warn('System is rebooting.');
      exec('sudo reboot', function(err, stdout, stderr){if(err){logger.error('Couldn\' reboot: ' + err)}});
    }

    // Send out new settings
    socket.emit('settings-systemSettings', settings);

    // AP on
    if(data.apOn != undefined) {
      settings.wireless.apOn = data.apOn;
      // Access point is on
      if(settings.wireless.apOn) {
        logger.info('WiFi turned off.');
        logger.info('Access poing turned on.');
        // Enable the services so that they can start and start at start
        exec("sudo update-rc.d hostapd enable && sudo update-rc.d dnsmasq enable", (err, stdout, stderr) => {
          if (err) {logger.error('Coundn\'t enable hostapd or dnsmasq: ' + err);}
        });

        // Start services
        exec("sudo service hostapd start && sudo service dnsmasq start", (err, stdout, stderr) => {
          if (err) {logger.error('Coundn\'t start hostapd or dnsmasq: ' + err);}
        });

        // Change /etc/dhcpcd.conf
        exec("sudo sed -i 's/#interface wlan0/interface wlan0/g' /etc/dhcpcd.conf && sudo sed -i 's/#static ip_address=10\.3\.141\.1\/24/static ip_address=10\.3\.141\.1\/24/g' /etc/dhcpcd.conf && sudo sed -i 's/#static routers=10\.3\.141\.1/static routers=10\.3\.141\.1/g' /etc/dhcpcd.conf && sudo sed -i 's/#static domain_name_server=1\.1\.1\.1 8\.8\.8\.8/static domain_name_server=1\.1\.1\.1 8\.8\.8\.8/g' /etc/dhcpcd.conf", (err, stdout, stderr) => {
          if (err) {logger.error('Coundn\'t change /etc/dhcpcd.conf: ' + err);}
        });
      }
      else {
        logger.info('Access point turned off.');
        // Disable the services so that they cannot start at boot
        exec("sudo update-rc.d hostapd disable && sudo update-rc.d dnsmasq disable", (err, stdout, stderr) => {
          if (err) {logger.error('Coundn\'t disable hostapd or dnsmasq: ' + err);}
        });

        // Stop services
        exec("sudo service hostapd stop && sudo service dnsmasq stop", (err, stdout, stderr) => {
          if (err) {logger.error('Coundn\'t stop hostapd or dnsmasq: ' + err);}
        });

        // Change /etc/dhcpcd.conf
        exec("sudo sed -i 's/interface wlan0/#interface wlan0/g' /etc/dhcpcd.conf && sudo sed -i 's/static ip_address=10\.3\.141\.1\/24/#static ip_address=10\.3\.141\.1\/24/g' /etc/dhcpcd.conf && sudo sed -i 's/static routers=10\.3\.141\.1/#static routers=10\.3\.141\.1/g' /etc/dhcpcd.conf && sudo sed -i 's/static domain_name_server=1\.1\.1\.1 8\.8\.8\.8/#static domain_name_server=1\.1\.1\.1 8\.8\.8\.8/g' /etc/dhcpcd.conf", (err, stdout, stderr) => {
          if (err) {logger.error('Coundn\'t change /etc/dhcpcd.conf: ' + err);}
        });

        // Start wifi
        logger.info('WiFi turned on.');
      }
      // Update settings.json
      fs.writeFile('settings.json', JSON.stringify(settings, null, 2), function(err,data) {
        if(err){logger.error('Error saving to settings.js: ' + err);}
      });

      logger.warn('System is rebooting.');
      exec('sudo reboot', function(err, stdout, stderr){if(err){logger.error('Couldn\' reboot: ' + err)}});
    }

    // Send out new settings
    socket.emit('settings-systemSettings', settings);

    // Update settings.json
    fs.writeFile('settings.json', JSON.stringify(settings, null, 2), function(err,data) {
      if(err){logger.error('Error saving to settings.js: ' + err);}
    });

  });
});
/*** END - SOCKETS ***/
