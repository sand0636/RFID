/*
 * RFIDNetwork - Ben Duggan
 * 10/3/18
 * Code that sends a RFID to the server at set intervals
 */

#include <SD.h>

#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include "RFIDNetwork.h"

#define SDselect 7

RF24 radio(8,9);
RF24Network network(radio);
RF24Mesh mesh(radio, network);

RFIDNetwork RFIDNetwork(radio, network, mesh);

long t = 0;
uint8_t messageInterval = 1000; //How often to send a message in milliseconds

void setup() {
  Serial.begin(9600);
  Serial.println("Begin: ");


  //Set up the SD card
  digitalWrite(SDselect, HIGH);  //Make both chip selects high (not selected)
  Serial.print("Initializing SD card...\n");              //message to user
  if (!SD.begin(SDselect)) {                            //Initiate the SD card function with the pin that activates the card.
    Serial.println("\nSD card failed, or not present");   //SD card error message
    //return;
  }// end check SD
  else {
    Serial.println("SD present");
  }
  digitalWrite(SDselect, HIGH); //Make sure SD card is turned off
  
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

    File dataFile = SD.open("testData.txt", FILE_WRITE);        //Initialize the SD card and open the file "datalog.txt" or create it if it is not there.
    if(dataFile) {
      dataFile.print("ABCDEFGHIJ");
      dataFile.print(" ");                        //comma for data delineation
      dataFile.println(RFIDNetwork.getTime());               //log the time
      dataFile.close();                           //close the file
      Serial.println("saved to SD card.");        //serial output message to user
    } // check dataFile is present
    else {
      Serial.println("error opening datalog.txt");  //error message if the "datafile.txt" is not present or cannot be created
    }// end check for file
    
  }

  //Serial.print("Time: ");
  //Serial.println(network.getTime(), DEC);

  
  delay(5);
}
