#!/bin/bash
sudo killall node

cd /home/pi/RFID-Network/server/RFIDNetworkPi
sudo python main.py &

cd ..
sudo node index
