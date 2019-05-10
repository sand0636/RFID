
/*
 * Code to test the actual data rate and number of packets dropped using the RF24Mesh.  This is largely taken from the transfer example for the RF24 library
 * Ben Duggan
 * 9/16/18
 */

#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include "printf.h"
#include <SPI.h>

/*** Variables to change ***/
#define cs 8 //Pin connected to the ce (chip enable)
#define csn 9 //Pin connected to the cs (chip select)
uint8_t channel = 10; //Channel the radios are using 0-124
#define thisID 0 //This nodes ID 0 for master(giving data rate) 1-127 for other 
uint8_t powerLevel = RF24_PA_MIN; //Power level of this node (RF24_PA_MIN, RF24_PA_LOW, RF24_PA_HIGH, or RF24_PA_MAX)
rf24_datarate_e dataRate = RF24_250KBPS; //Data rate of this node (RF24_250KBPS, RF24_1MBPS or RF24_2MBPS)
#define ledPin LED_BUILTIN //What pin is the led connected to
//#define Serial SerialUSB // Uncomment this line if you are testing with a SAMD based board
/*** ***/


RF24 radio(cs, csn);
RF24Network network(radio);
RF24Mesh mesh(radio, network);


void setup() {
  Serial.begin(9600);
  printf_begin();
  Serial.println("Begin: This may take a minute if you just changed the settings...");

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, HIGH);
  delay(500);
  digitalWrite(ledPin, LOW);

  mesh.setNodeID(thisID);
  mesh.begin(channel, dataRate); //Start mesh using this channel and data rate
  radio.setPALevel(powerLevel); //Set the PA level of the radio

  radio.printDetails(); //Prints all the details of the radio.  Usefull to double check that you set things correctly

  for(int i=0; i<5; i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
  }
  Serial.println("Starting main loop...");

  delay(3000);

  radio.powerDown();

  delay(5000);

  //radio.powerUp();
}

void loop() {
  mesh.update();

  if(thisID == 0) {
    mesh.DHCP();
  }
}
