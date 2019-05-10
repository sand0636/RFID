/*
 * RFIDNetwork - Ben Duggan
 * 11/11/18
 * Code that sends a RFID to the server at set intervals
 */

#include <Wire.h>        //include the standard wire library - used for I2C communication with the clock
#include <SD.h>          //include the standard SD card library
#include "RTClib.h"

#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include "RFIDNetwork.h"

#define serial SerialUSB
#define SDselect 7    //Chip select for SD card - make this pin low to activate the SD card, also the clock interupt pin

RTC_RV1805 rtc;

RF24 radio(3,4);
RF24Network network(radio);
RF24Mesh mesh(radio, network);

RFIDNetwork RFIDNetwork(radio, network, mesh);

unsigned long t = 0;
unsigned long messageInterval = 1000; //How often to send a message in milliseconds

String timeString; //String for storing the whole date/time line of data
byte ss, mm, hh, da, mo, yr;          //Byte variables for storing date/time elements

void setup() {
  serial.begin(9600);
  serial.println("Begin: ");

  rtc.begin();  // Is this needed? Seems to be necessary - could be made more efficient though

  getTime();                      //Read from the time registers 
  serial.println();
  serial.print("Clock set to ");  //message confirming clock time
  serial.println(timeString);

  //Set up the SD card
  digitalWrite(SDselect, HIGH);  //Make both chip selects high (not selected)
  serial.print("Initializing SD card...\n");              //message to user
  if (!SD.begin(SDselect)) {                            //Initiate the SD card function with the pin that activates the card.
    serial.println("\nSD card failed, or not present");   //SD card error message
    //return;
  }// end check SD
  else {
    serial.println("SD present");
  }
  digitalWrite(SDselect, HIGH); //Make sure SD card is turned off
  
  RFIDNetwork.setID(100);
  RFIDNetwork.useGlobalTimer(false);
  RFIDNetwork.begin();

  //printf_begin();
  //radio.printDetails();
}

void loop() {
  RFIDNetwork.update();
  
  if(millis()-t > messageInterval) {
    t = millis();
    
    RFIDNetwork.newRead("ABCDEFGHIJ", rtc.now().unixtime());

    getTime(); 
    File dataFile = SD.open("testData.txt", FILE_WRITE);        //Initialize the SD card and open the file "datalog.txt" or create it if it is not there.
    if(dataFile) {
      dataFile.print("ABCDEFGHIJ");
      dataFile.print(" ");                        //comma for data delineation
      dataFile.println(timeString);               //log the time
      dataFile.close();                           //close the file
      serial.println("saved to SD card.");        //serial output message to user
    } // check dataFile is present
    else {
      serial.println("error opening datalog.txt");  //error message if the "datafile.txt" is not present or cannot be created
    }// end check for file
  }

  
  delay(5);
}

void getTime() {  //Read in the time from the clock registers
  DateTime now = rtc.now();
  ss = now.second(); //second
  mm = now.minute(); //minute
  hh = now.hour(); //hour
  da = now.day(); //day of month
  mo = now.month(); //month
  yr = now.year(); //year
  timeString = String(now.month()) + "/" + String(now.day()) + "/" +
               String(now.year()) + " " + String(now.hour()) + ":" + 
               String(now.minute()) + ":" + String(now.second()); 
}
