
/* Code to test the actual data rate and number of packets dropped using the RF24Mesh.  This is largely taken from the transfer example for the RF24 library
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
uint8_t channel = 108; //Channel the radios are using 0-124
#define thisID 1 //This nodes ID 0 for master(giving data rate) 1-127 for other 
#define otherNode 2 //The other nodeId in the network (0-127; not self)
uint8_t powerLevel = RF24_PA_LOW; //Power level of this node (RF24_PA_MIN, RF24_PA_LOW, RF24_PA_HIGH, or RF24_PA_MAX)
rf24_datarate_e dataRate = RF24_250KBPS; //Data rate of this node (RF24_250KBPS, RF24_1MBPS or RF24_2MBPS)
unsigned long cycles = 1000; //How many samples to run during each loop
//#define Serial SerialUSB // Uncomment this line if you are testing with a SAMD based board
/*** ***/


RF24 radio(cs, csn);
RF24Network network(radio);
RF24Mesh mesh(radio, network);

byte data[32];
unsigned long startTime, pauseTime, stopTime;
unsigned long counter = 0;
unsigned long displayTimer=0;
unsigned long rxTimer;

void setup() {
  Serial.begin(9600);
  printf_begin();
  Serial.println("Begin: This may take a minute if you just changed the settings...");

  mesh.setNodeID(thisID);
  mesh.begin(channel, dataRate); //Start mesh using this channel and data rate
  radio.setPALevel(powerLevel); //Set the PA level of the radio

  radio.printDetails(); //Prints all the details of the radio.  Usefull to double check that you set things correctly

  for(int i=0; i<32; i++){
     data[i] = random(255);               //Load the buffer with random data
  }
  
  Serial.println("Starting main loop...");
}

void loop() {
  mesh.update();

  if(thisID == 0) {
    mesh.DHCP();
    
     while(network.available()){ 
      RF24NetworkHeader header;
      network.read(header, &data, 32);
      counter++;
     }
     if(millis() - rxTimer > 1000){
       rxTimer = millis();     
       unsigned long numBytes = counter*32;
       Serial.print(F("Rate: "));
       //Prevent dividing into 0, which will cause issues over a period of time
       Serial.println(numBytes > 0 ? numBytes/1000.0:0);
       Serial.print(F("Payload Count: "));
       Serial.println(counter);
       counter = 0;
     }

     if(millis() - displayTimer > 5000){
      displayTimer = millis();
      Serial.println(" ");
      Serial.println(F("********Assigned Addresses********"));
       for(int i=0; i<mesh.addrListTop; i++){
         Serial.print("NodeID: ");
         Serial.print(mesh.addrList[i].nodeID);
         Serial.print(" RF24Network Address: 0");
         Serial.println(mesh.addrList[i].address,OCT);
       }
      Serial.println(F("**********************************"));
    }
    
  }
  else {
     //delay(500);
    
    Serial.println(F("Initiating Basic Data Transfer"));

    startTime = millis();
    pauseTime = millis();


    for(int i=0; i<cycles; i++){        //Loop through a number of cycles
      data[0] = i;                      //Change the first byte of the payload for identification
      if(!mesh.write(&data,'M',32)){   //Write to the FIFO buffers        
        counter++;                      //Keep count of failed payloads
      }
    }
    
     stopTime = millis();   
     
     float numBytes = cycles*32;
     float rate = numBytes / (stopTime - startTime);
      
     Serial.print("Transfer complete at "); Serial.print(rate); Serial.println(" KB/s");
     Serial.print(counter); Serial.print(" of "); Serial.print(cycles); Serial.println(" Packets Failed to Send");
     
     counter = 0;   
  }
}
