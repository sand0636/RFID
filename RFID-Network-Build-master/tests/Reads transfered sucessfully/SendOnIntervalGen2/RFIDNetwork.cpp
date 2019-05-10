#include <Arduino.h>
#include <TimeLib.h>
#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include "RFIDNetwork.h"

RFIDNetwork::RFIDNetwork(RF24& _radio, RF24Network& _network, RF24Mesh& _mesh): radio(_radio), network(_network), mesh(_mesh) {
  
}

void RFIDNetwork::setID(uint8_t _id) {
  mesh.setNodeID(_id);
}

void RFIDNetwork::begin() {
  mesh.begin();
  lastMillis = millis();
}

uint8_t* RFIDNetwork::update() {
  mesh.update();

  // Check for a new read and deal with it if there is one
  while (network.available()) {
    RF24NetworkHeader header;
    uint8_t message[64];
    network.read(header, &message, sizeof(message));
    switch(header.type) {
      case 'R':
        removeRead(message[20]);
        break;
      case 'T':
        long _t = 0;
        for(int i=0; i<10; i++) {
          long multiplicationFactor = 1;
          for(int j=9; j>i; j--) {
            multiplicationFactor *= 10;
          }
          _t += multiplicationFactor * (uint8_t(message[i])-48); 
        }
        setTime(_t);
        timeNeedsSetting = false;
        
        Serial.print("Time updated: ");
        Serial.println(now(), DEC);
        break;
    }
  }

  
  //timeStatus() == timeNotSet && (millis()%500 == 0)
  if(usingGlobalTimer && ((millis()-clockExpiredTimeCounter > clockExpiredTime) || (timeNeedsSetting && (millis()-clockExpiredTimeCounter > clockInitialTimeFreq)) )) {
    clockExpiredTimeCounter = millis();
    // Send end time request
    if(!mesh.write("", 'T', sizeof(""))) {
      if ( ! mesh.checkConnection() ) {
        //refresh the network address
        Serial.println("Renewing Address");
        mesh.renewAddress();
      }
    }
  }

  // Send a read if its needed
  if((retryTime < millis()-lastMillis) && numberOfReads > 0) {
    lastMillis = millis();
    Serial.println("Sending read.");
    if(!mesh.write(&reads[0], 'R', sizeof(reads[0]))) {
      if ( ! mesh.checkConnection() ) {
        //refresh the network address
        Serial.println("Renewing Address");
        if(mesh.renewAddress(150) == 0) {
          // Not able to renew address
          Serial.println("Not able to renew the address");
          lastMillis = millis() - 1000;
        }
      }
    }
  }
}


void RFIDNetwork::newRead(char *_rfidTag) {
  Serial.println(numberOfReads, DEC);
  newRead(_rfidTag, (long)now());
}

void RFIDNetwork::newRead(char *_rfidTag, long _t) {
  // Check to see if there is room in the queue
  if(numberOfReads < readsCacheSize) {
    // Add the RFID tag
    for(int i=0; i<10; i++) {
      reads[numberOfReads][i] = _rfidTag[i];
      
      reads[numberOfReads][19-i] = char((_t%10) +48);
      _t = (long)(_t/10);
    }
    reads[numberOfReads][20] = ((readNumber++)%30)+33;  //The counter that prevents from duplicate reads beeing added
    numberOfReads++; //Incriment reads counter
  }
}

void sleep() {
  // Tell the root we're sleeping
  /*
  if(!mesh.write("S", 'S', sizeof("S"))) {
    Serial.println("Sleep message not sent");
  }
  */
  
  //sleeping = true;
  //mesh.releaseAddress();
  //radio.powerDown();
}

void awake() {
  //sleeping = false;
  //radio.powerUp();
  //mesh.renewAddress();
}

void RFIDNetwork::removeRead(uint8_t _readNumber) {
  for(int i=0; i<numberOfReads; i++) {
    if(reads[i][20] == _readNumber) {
      for(int j=i+1; j<numberOfReads; j++) {
        for(int k=0; k<21; k++) {
          reads[i][k] = reads[j][k];
        }
      }
      numberOfReads--;
    }
  }
}

void RFIDNetwork::useGlobalTimer(bool _use) {
  usingGlobalTimer = _use;
}

void RFIDNetwork::makeTime(time_t _t) {
  timeNeedsSetting = false;
  setTime(_t);
}

void RFIDNetwork::makeTime(byte _hr, byte _min, byte _sec, byte _day, byte _month, byte _yr) {
  setTime(_hr, _min, _sec, _day, _month, _yr);
}

long RFIDNetwork::getTime() {
  return now();
}




