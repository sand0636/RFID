/* Ben Duggan
 * 10/26/18
 * Script for handeling the communication between the master and nodes
 */

var readNumberCache = {}; //Hold the message read number to prevent duplicate reads
var tempDBCache = {rfid:[], reader:[]}; //Holds rfids and readers that are being added asycn to prevent duplicate additions
let pathToFiles = "/RFIDNetworkPi/reads/"; //Local path to reads files

// Start the radio
module.exports.begin = function() {
  checkReadFiles();

  setInterval(function() {checkReadFiles()}, 1000);

  logger.info('Radio started');
}

// Check to see if there are any new read files and add their reads if they are preesent
function checkReadFiles() {
  fs.readdir(__dirname+pathToFiles, (err, items) => {
    if(err) {
      logger.error(err);
      io.emit('errorMessage', {"level":"error","message":err});
    }

    for(var i=0; i<items.length; i++) {
      var filename = items[i];

      if(filename == '.gitignore') {
        continue;
      }

      // Read in file if it exists
      if(fs.existsSync(__dirname+pathToFiles+filename)) {
       fs.readFile(__dirname+pathToFiles+filename, function read(err, data) {
           if (err) {
             logger.error(err);
             io.emit('errorMessage', {"level":"error","message":err});
             return ;
           }

           var fileContent = data.toString().replace("\r\n", "").split(";");
           let content = [];

           for(var i=0; i<fileContent.length; i++) {
             if(fileContent[i].length > 0) {
               content = fileContent[i].split(" ");
               newRead(content[0], content[1]);
             }
           }
       });
       // Remove file (kinda risky to do it this way, if there is an error with sql then nothing will be saved)
       fs.unlink(__dirname+pathToFiles+filename, (err) => {
         if (err) {
           logger.error(err);
           io.emit('errorMessage', {"level":"error","message":err});
         }
       });
      }
    }
  });
}


// Handel the new read recieved by the radio
function newRead(reader, message) {
 let rfid = message.substr(0,10);
 let transmitionDate = new Date(parseInt(message.substr(10, message.length-11) + "000"));
 let messageID = message.substr(message.length-1,1);

 // If the read that was sent has been seen before, don't re add it
 if(readNumberCache[reader]) {
   if(readNumberCache[reader].includes(messageID)) {
     return;
   }

   if(readNumberCache[reader].length >= 5) {
     readNumberCache[reader].shift();
   }
   readNumberCache[reader].push(messageID);
 }
 else {
   readNumberCache[reader] = [messageID];
 }

 // Add the rfid to the database if it's not already in it
 if(!RFIDBandMap[rfid] && !tempDBCache.rfid.includes(rfid)) {
   tempDBCache.rfid.push(rfid);
   queryDB("INSERT INTO birds (rfidTag, bandID, sex, age, taggedDateTime, taggedLocation, comment) VALUES ('"+rfid+"', 'unknown', 'unknown', 'unknown', '"+transmitionDate.toSQLString()+"', '"+reader+"', 'not entered')").then(function(resolve) {
     console.log("added rfid: " + rfid);
     RFIDList.push(rfid);
     RFIDBandMap[rfid] = 'unknown';
     RFIDBandMap['unknown'] = rfid;
     tempDBCache.rfid.pop(rfid);
     io.emit('systemsVariables', {"RFIDBandMap":RFIDBandMap, "readersBoxMap":readersBoxMap});
   }).catch(function(reject) {
     logger.error(reject);
     io.emit('errorMessage', {"level":"error","message":reject});
     tempDBCache.rfid.pop(rfid);
   });
 }

 // Add the reader to the database if it's not already in it
 if(!readersBoxMap[reader] && !tempDBCache.reader.includes(reader)) {
   tempDBCache.reader.push(reader);
   queryDB("INSERT INTO boxes(box, reader, fieldSite, lat, lon, taggedDateTime, comment) VALUES ('unknown','"+reader+"', NULL, 'unknown','unknown','"+transmitionDate.toSQLString()+"','not entered')").then(function(resolve) {
     console.log("added reader: " + reader);
     readersList.push(reader);
     readersBoxMap[reader] = 'unknown';
     readersBoxMap['unknown'] = reader;
     tempDBCache.reader.pop(reader);
     io.emit('systemsVariables', {"RFIDBandMap":RFIDBandMap, "readersBoxMap":readersBoxMap});
   }).catch(function(reject) {
     logger.error(reject);
     io.emit('errorMessage', {"level":"error","message":reject});
     tempDBCache.reader.pop(reader);
   });
 }

 // Add read to database
 queryDB("INSERT INTO readerdata (rfid, datetime, reader, box, fieldSite) VALUES ('"+rfid+"', '"+transmitionDate.toSQLString()+"', '"+reader+"', '"+readersBoxMap[reader]+"', NULL)").then(function(resolve) {
   io.emit('newRead', {"rfid":rfid, "dateTime":transmitionDate.toSQLString(), "reader":reader, "box":readersBoxMap[reader]});
 }).catch(function(reject) {
   logger.error(reject);
   io.emit('errorMessage', {"level":"error","message":reject});
 });
}
