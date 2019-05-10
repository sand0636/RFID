/*
 * Ben Duggan
 * Temperature sensor, outputing using PLX-QAD and relay shutoff at given temp level
 * 4/13/18 13:39
 */

#include <OneWire.h> 
#include <DallasTemperature.h>

#define relayPin 3 //Pin that the relay is attached to
int maxTemp = 60; //Max temperature in celcious
bool tempTripped = false; //If we hit the max temp this will flag to let the system cool down
int tempCoolDown = 55; //How much do you want the temp to cool down by before the system turns on again
#define ONE_WIRE_BUS 2 //Data wire is plugged into pin 2 on the Arduino
OneWire oneWire(ONE_WIRE_BUS); //Setup a oneWire instance to communicate with any OneWire devices; (not just Maxim/Dallas temperature ICs) 
DallasTemperature sensors(&oneWire); //Pass our oneWire reference to Dallas Temperature. 

void setup(void) { 
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);
  
   // start serial port 
   Serial.begin(9600); 
  
   // Start PLX-DAQ
   Serial.println("CLEARDATA"); //clears up any data left from previous projects
   Serial.println("LABEL,Computer Time,Time(sec.),Temp(C)"); //always write LABEL, so excel knows the next things will be the names of the columns (instead of Acolumn you could write Time for instance)
   Serial.println("RESETTIMER"); //resets timer to 0
 
  // Start up the library 
  sensors.begin(); 
} 

void loop(void) { 
  sensors.requestTemperatures(); // Send the command to get temperature readings 
  
  // If the temp is above the max; shut off the battery
  if(sensors.getTempCByIndex(0) >= maxTemp) {
    Serial.print("DATA,TIME,"); //writes the time in the first column A and the time since the measurements started in column B
    Serial.print(millis()/1000);
    Serial.print(",");
    Serial.println(sensors.getTempCByIndex(0)); 
    digitalWrite(relayPin, LOW);  
    tempTripped = true;
  }
  else if(tempTripped && sensors.getTempCByIndex(0) >= tempCoolDown) {
    Serial.print("DATA,TIME,"); //writes the time in the first column A and the time since the measurements started in column B
    Serial.print(millis()/1000);
    Serial.print(",");
    Serial.println(sensors.getTempCByIndex(0)); 
    digitalWrite(relayPin, LOW); 
  }
  else {
    Serial.print("DATA,TIME,"); //writes the time in the first column A and the time since the measurements started in column B
    Serial.print(millis()/1000);
    Serial.print(",");
    Serial.println(sensors.getTempCByIndex(0)); 
    digitalWrite(relayPin, HIGH);
    tempTripped = false;
  }
  delay(1000); 
} 
