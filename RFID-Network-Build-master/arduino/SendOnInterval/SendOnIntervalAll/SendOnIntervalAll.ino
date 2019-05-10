/*
 * RFIDNetwork - Ben Duggan
 * 10/3/18
 * Code that sends a RFID to the server at set intervals
 */

#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include "RFIDNetwork.h"

RF24 radio(3,4);
RF24Network network(radio);
RF24Mesh mesh(radio, network);

RFIDNetwork RFIDNetwork(radio, network, mesh);

uint16_t t = 0;
uint16_t messageInterval = 1000; //How often to send a message in milliseconds

void setup() {
  Serial.begin(9600);
  Serial.println("Begin: ");
  
  RFIDNetwork.setID(1);
  RFIDNetwork.useGlobalTimer(true);
  //network.makeTime(300);
  RFIDNetwork.begin();
}

void loop() {
  RFIDNetwork.update();
  

  if(millis()-t > messageInterval) {
    t = millis();
    
    RFIDNetwork.newRead("ABCDEFGHIJ");
  }

  //Serial.print("Time: ");
  //Serial.println(network.getTime(), DEC);

  
  delay(5);
}
