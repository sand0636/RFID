#include <SoftwareSerial.h> // Used for RS232-to-TTL
#include <SPI.h>
#include <SD.h>

const int chipSelect = 4;
long t = 0;
uint8_t messageInterval = 1000; //How often to send a message in milliseconds

SoftwareSerial RS232(2,3);

void setup() {
  Serial.begin(9600);
  RS232.begin(38400);

  Serial.print("Initializing SD card...");

  // see if the card is present and can be initialized:
  if (!SD.begin(chipSelect)) {
    Serial.println("Card failed, or not present");
    // don't do anything more:
    while (1);
  }
  Serial.println("card initialized.");

}

void loop() {

  if(millis()-t > messageInterval) {
    t = millis();
    
    File dataFile = SD.open("datalog.txt", FILE_WRITE);

    // if the file is available, write to it:
    if (dataFile) {
      dataFile.print("ABCDEFGHIJ");
      dataFile.print(" ");
      dataFile.println(String(millis()));
      dataFile.close();
      // print to the serial port too:
    }
    // if the file isn't open, pop up an error:
    else {
      Serial.println("error opening datalog.txt");
    }

    RS232.print("ABCDEFGHIJ"+char(13)+char(10));

    Serial.println("Read added");
  }
  else {
    RS232.println("FFFFFFFFFF"+char(13)+char(10));
    
  }


  delay(400);
  

}
