/*
 * Ben Duggan
 * Read voltage of battery, check to see if board is on, use a servo w\ pit to test reads, outputing using PLX-QAD
 * 4/25/18 03:00
 */

#include <Servo.h>

#define servoPin 3 // Pin that the servo is attached to
#define batteryVoltagePin A0 //
#define boardOnPin 4 //
#define servoOnPin 5 //
int servoUp = 5; // Posisiton where the servo is up
int servoDown = 175; // Posisition where the servo is down
long printTime = 1; //Seconds
long timer = 0;
int boardPrevious = 1;
int servoPrevious = 1;
bool flag = false;

Servo servo;

void setup(void) { 
  servo.attach(servoPin);
  
  pinMode(boardOnPin, INPUT);
  pinMode(servoOnPin, INPUT);
  
  // start serial port 
  Serial.begin(9600); 
  
  // Start PLX-DAQ
  Serial.println("CLEARDATA"); //clears up any data left from previous projects
  //Serial.println("LABEL,Computer Time,Time(sec.),Battery voltage(V),Board on(bool),Servo on(bool)"); //always write LABEL, so excel knows the next things will be the names of the columns (instead of Acolumn you could write Time for instance)
  Serial.println("LABEL,Computer Time,Time(sec.),Board on(bool),Servo on(bool)"); //always write LABEL, so excel knows the next things will be the names of the columns (instead of Acolumn you could write Time for instance)
  Serial.println("RESETTIMER"); //resets timer to 0
} 

void loop(void) {   
  // Adds an entry if the board is turned off
  if(digitalRead(boardOnPin) != boardPrevious) {
    flag = true;
  }
  boardPrevious = digitalRead(boardOnPin);

  if(digitalRead(servoOnPin) != servoPrevious) {
    flag = true;
  }
  servoPrevious = digitalRead(servoOnPin);
  
  if(digitalRead(servoOnPin) == HIGH) {
    servo.write(servoDown);
    delay(500);
    servo.write(servoUp);
    delay(500);
  }

  if(flag) {
    printUpdate();
    flag = false;
  }
  
  // Controls when to print
  if((millis()-timer)%300000 >= (printTime*1000)) {
    printUpdate();
    Serial.println(timer);
    timer = millis()%300000;
  }
} 

// Print the data so PLX-QAD can record it
void printUpdate() {
  //Serial.print("DATA,TIME,Battery voltage,Board on,Servo on,");
  Serial.print("DATA,TIME,Board on,Servo on,");
  Serial.print(millis()/1000);
  //Serial.print(",");
  //Serial.print(calculateVoltage());
  Serial.print(",");
  Serial.print(digitalRead(boardOnPin) == HIGH);
  Serial.print(",");
  Serial.println(digitalRead(servoOnPin) == HIGH);
}

String calculateVoltage() {
  
  return "";
}


