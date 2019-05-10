#include <Arduino.h>
#include <TimeLib.h>
#include "RFIDNetwork.h"
#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include <SPI.h>

RFIDNetwork::RFIDNetwork(uint8_t _rx, uint8_t _tx): radio(_rx, _tx), network(radio), mesh(radio, network) {
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

    network.peek(header, &message, sizeof(message));
    Serial.print("Message with data {from: ");
    Serial.print(header.from_node);
    Serial.print(", type: ");
    Serial.print(header.type);
    Serial.print("}");

    switch(header.type) {
      case 'R':
        network.read(header, &message, sizeof(message));
        Serial.print("message: ");
        for(int i=0; i<64; i++) {
          Serial.print(char(message[i]));
        }
        Serial.println();
        removeRead(message[20]);
        break;
      case 'T':
        network.read(header, &message, sizeof(message));
        Serial.print("message: ");
        for(int i=0; i<64; i++) {
          Serial.print(char(message[i]));
        }
        Serial.println();

        long t = 0;
        for(int i=0; i<10; i++) {
          t += int(message[i])*pow(10,9-i);
        }
        Serial.println(t, DEC);
        
        setTime(t);
        timeNeedsSetting = false;
        break;
    }

  }
    
//timeStatus() == timeNotSet && (millis()%500 == 0)
  if(usingGlobalTimer && ((millis()-clockExpiredTimeCounter > clockExpiredTime) || (timeNeedsSetting && (millis()-clockExpiredTimeCounter > clockInitialTimeFreq)) )) {
    clockExpiredTimeCounter = millis();
    // Get a time request
    if (!mesh.write("a", 'T', sizeof("a"))) {
      // If a write fails, check connectivity to the mesh network
      if (!mesh.checkConnection()) {
        Serial.println("Renewing Address");
        mesh.renewAddress();
      } else {
        Serial.println("Send fail, Test OK");
      }
    }
  }

  // Send a read if its needed
  if((retryTime < millis()-lastMillis) && numberOfReads > 0) {
    lastMillis = millis();
    if(numberOfReads > 0) {
      if (!mesh.write(reads[0], 'R', sizeof(reads[0]))) {
        // If a write fails, check connectivity to the mesh network
        if (!mesh.checkConnection()) {
          Serial.println("Renewing Address");
          mesh.renewAddress();
        } else {
          Serial.println("Send fail, Test OK");
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
    reads[numberOfReads][20] = ((readNumber++)%127)+32;  //The counter that prevents from duplicate reads beeing added
    numberOfReads++; //Incriment reads counter
  }
}

void RFIDNetwork::setID(uint8_t _id) {
  mesh.setNodeID(_id);
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
