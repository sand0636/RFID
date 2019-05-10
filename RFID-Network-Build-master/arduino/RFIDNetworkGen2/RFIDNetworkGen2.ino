/*
 * RFIDNetwork - Ben Duggan
 * 10/3/18
 * Code for Gen.2 to interface with the RFIDNetwork
 */

#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include "RFIDNetwork.h"
#include <SoftwareSerial.h> // Used for RS232-to-TTL

RF24 radio(3,4);
RF24Network network(radio);
RF24Mesh mesh(radio, network);

RFIDNetwork RFIDNetwork(radio, network, mesh);

SoftwareSerial RS232(8, 9);
char data[70];
uint8_t dataLen = 0;
bool badRead = false;

void setup() {
  Serial.begin(9600);
  Serial.println("Begin: ");
  RS232.begin(38400); //Set to Gen.2 Serial baud rate
  
  RFIDNetwork.setID(2);
  RFIDNetwork.useGlobalTimer(true);
  RFIDNetwork.begin();

  delay(1000);
}

void loop() {
  RFIDNetwork.update();

  // Look for data from the Gen. 2 serial port
  if(RS232.available() > 0) {    
    while(RS232.available() > 0) {
      // Check to see if the end of message characters (10 followed by 13) are given     
      if(RS232.peek() != 10 && RS232.peek() != 13 && dataLen < 70) {
        // Check to see if the current char is valid (meaning not a valid character in a RFID tag)
        if(RS232.peek() < 48 || RS232.peek() > 90 || (RS232.peek() > 57 && RS232.peek() < 65)) {
          Serial.println("Invalid character.");
          badRead = true;
        }
        
        data[dataLen++] = char(RS232.read());
      }
      else {
        // End of line
        if(badRead || dataLen == 0) {
          badRead = false;
          dataLen = 0;
        }
        else {
          // Check if this is a valid RFID and add if if so
          if(dataLen != 10) {
            dataLen = 0; //Invalid read so disgard
            Serial.println("Read length not equal to 10");
          }
          else {
            // Check that the read is not null (FFFFFFFFFF)
            badRead = true; //Reuse the badRead variable and set it to false if there is at least one character thats not 'F'
            for(int i=0; i<dataLen; i++) {
              if(data[i] != 'F') {
                badRead = false;
              }
            }
            
            if(!badRead) {
              // The RFID tag is VALID; add it to the system
              Serial.print("VALID READ: ");
              char validTag[10];
              for(int i=0; i<10; i++) {
                validTag[i] = data[i];
              }
              
              RFIDNetwork.newRead(validTag);
            }
            if(dataLen > 0) {
                for(int i=0; i<dataLen; i++) {
                  Serial.print(data[i]);
                }
                Serial.println();
                dataLen = 0;
              }
            dataLen = 0;
            badRead = false;
          }
        }
        // Clear out any end of line characters
        while(RS232.peek() == 10 || RS232.peek() == 13) {
          RS232.read();
          delay(1);
        }
      }
      delay(1);
    }
  }
}
