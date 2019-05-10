#!/bin/bash

INSTALL_PATH="."
INSTALL_DIR="/RFID-Network"

ROOT_PATH=${INSTALL_PATH}
ROOT_PATH+=${INSTALL_DIR}

echo "RFID-Network automatic installer"
echo "Ben Duggan - 11/5/2018"
echo ""
echo "Are you sure you want to install this [Y/n]? " 
read answer
case ${answer^^} in
	echo "Not installing"
	echo "Goodbye"
	n ) exit 0
esac

echo "Stargin installation (this will take a while)..."

# ====== Step 2 ======
# Update the system
echo "Updating the Raspberry Pi's software"
sudo apt-get update && apt-get upgrade
echo ""

# Configure /boot/config.txt
echo "Editing /bost/config.txt (raspi-config"

echo""

# ====== Step 3 ======
# Setup RTC
echo "Setting up real time clock (RTC)"
echo "Make sure the RTC is connected as shown below (for DS3231):"
echo "    VCC (+) -> Pin 1 (3.3 V)"
echo "    D -> Pin 3 (SDA / GPIO 2)"
echo "    C -> Pin 5 (SCL / GPIO 3)"
echo "    NC -> Pin 7 (GPCLK0 / GPIO 4)"
echo "    - -> Pin 9 (Ground)"

# Install GitHub repo
echo "Installing RFID-Network GitHub repo"
git clone "https://github.com/BenSDuggan/RFID-Network.git"
echo ""

