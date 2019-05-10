/*
 * Ben Duggan
 * 10/30/18
 * Program for interfacing with the server.  This script communicates to node using web sockets except for saving reads, which is done by saving the reads to a file inside the tempReads directory which will be read by node and saved to the DB.
 */


#include <stdlib.h>
#include <iostream>
#include <string>
#include <ctime>
#include <math.h>
#include <fstream>
#include <chrono> //Used for millis and time

#include "RF24Mesh/RF24Mesh.h"
#include "RF24/RF24.h"
#include "RF24Network/RF24Network.h"

using namespace std;
using namespace std::chrono;

string fieldSite = "Test";
string readsHolder = ""; //Reads that need to be saved to the tempReads file to be uploaded to the database
uint32_t saveReadsTime = 1000;  //How many milliseconds to wait before saving the file containint the reads

long long currMillis(void) {
	return duration_cast< milliseconds >(
	    system_clock::now().time_since_epoch()
	).count();
}

long long saveReadsCounter = currMillis(); //Counter to keep track of when to save reads
long long lastTimeDataSaved = currMillis(); //Counter to save the updated network table
long long updateTreeCounter = currMillis(); //Counter to save the when the rf24Tree was last updated

RF24 radio(25, 0);
RF24Network network(radio);
RF24Mesh mesh(radio,network);

int main(void) {
	Tree *t = (Tree *)malloc(10000);

	mesh.setNodeID(0);
	// Connect to the mesh
	mesh.begin();
	radio.printDetails();

	while(1) {
	  // Call network.update as usual to keep the network updated
	  mesh.update();

	  // In addition, keep the 'DHCP service' running on the master node so addresses will
	  // be assigned to the sensor nodes
	  mesh.DHCP();

	  // Check for incoming data from the sensors
	  while(network.available()) {

	    RF24NetworkHeader header;
	    network.peek(header);
			uint8_t dat[64];

			cout << "from node: " << to_string(header.from_node) << endl;

	    switch(header.type) {
				// New read
				case 'R':
					// Add read to readsHolder to be saved as a file
					network.read(header,&dat,sizeof(dat));

					readsHolder += to_string(mesh.getNodeID(header.from_node)) + " ";
					for(int i=0; i<21; i++) {
						readsHolder += char(dat[i]);
					}
					readsHolder += ";";

					// Send back message
					header.to_node = header.from_node;
					header.from_node = 0;
					if(!network.write(header, dat, 64)) {
						// Error
					}
					break;
				// Sleep protocal
				case 'S':
					network.read(header,&dat,sizeof(dat));


					break;
				// Time request
				case 'T':
					// Send time
					long _t;
					network.read(header,&_t,sizeof(_t));
					header.to_node = header.from_node;
					header.from_node = 0;
					uint8_t message[64];
					long t =  currMillis()/1000;
					cout << "t=" << to_string(t) << endl;
					for(int i=9; i>=0; i--) {
						message[i] = t%10 + 48;
						t = t/10;
					}
					if(!network.write(header, message, 64)) {

					}
					break;
	    }
	  }

		// Save reads to output file
		if(currMillis()-saveReadsCounter > saveReadsTime) {
			saveReadsCounter = currMillis();
			if(readsHolder.length() > 0) {
				// Save readsHolder to readsHolder
				struct timeval tp;
				gettimeofday(&tp, NULL);
				string ms = to_string(tp.tv_usec/1000);

				cout << "Saving file." << endl;
				ofstream file("./reads/reads_" + to_string(tp.tv_sec) + (string(3-ms.length(), '0') + ms) + ".txt");
				file << readsHolder;
				file.close();
				readsHolder = "";
			}
		}

		// Save network table to file and output to commandline
		if(currMillis()-lastTimeDataSaved > 5000) {
				lastTimeDataSaved = currMillis();
				cout << "Saving network table." << endl;
				ofstream file("./networkTable.txt");
				cout << "*** Network Table: ***" << endl;
				for(int i=0; i<mesh.addrListTop; i++){
					// Output to file and command line
		    	file << "NodeID:";
					cout << "Node ID: " << to_string(mesh.addrList[i].nodeID) << "; RF24Network Address: " << to_string(mesh.addrList[i].address) << endl;
		      file << mesh.addrList[i].nodeID;
		      file << ";RF24Network Address:0";
		      file << mesh.addrList[i].address;
					file << "\n";
		   }
			cout << "**********************" << endl;

				//file << readsHolder;
				file.close();

			cout << "Tree looks like: " << endl;
			cout << t->toString();
		}
		//delay(1);
	}

	//system("PAUSE");
	return 0;
}
