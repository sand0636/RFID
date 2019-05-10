/*
 * This code is designed to read RFID tags sent over a RS232 to TTL converter and discard any data that is not a valid read.  
 * A valid read is a string with length 10 containing numbers and upercase latters.  The null RFID tag, "FFFFFFFFFF" is not concidered valid.
 * Ben Duggan
 * 9/15/18
 */

#include <SoftwareSerial.h>

SoftwareSerial RS232(2, 3);
char data[70];
uint8_t dataLen = 0;
bool badRead = false;

void setup() {
  Serial.begin(38400);
  RS232.begin(38400);

  Serial.println("Begin:");
}

void loop() {
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
              // Add it to the system
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


