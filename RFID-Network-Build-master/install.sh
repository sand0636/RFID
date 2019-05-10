#!/bin/bash

# RFID-Network install script
# Ben Duggan - 1/29/19 

# Define colors used in the script
COL_DEFAULT='\033[0;37m' # Normal terminal color
COL_LG='\033[1;32m' # Step
COL_LB='\033[1;34m' # General information
COL_LR='\033[1;31m' # Danger
COL_LP='\033[1;35m' # User input

# Getting pwd
parDir=$(pwd)


echo -e "${COL_LP}###########################################${COL_DEFAULT}"
echo -e "${COL_LB}#                                         #${COL_DEFAULT}"
echo -e "${COL_LB}#               RFIDNetwork               #${COL_DEFAULT}"
echo -e "${COL_LB}#              Ben S. Duggan              #${COL_DEFAULT}"
echo -e "${COL_LB}#        Indiana University * 2019        #${COL_DEFAULT}"
echo -e "${COL_LB}#                                         #${COL_DEFAULT}"
echo -e "${COL_LP}###########################################${COL_DEFAULT}"


echo -e "${COL_LB}Starting installation (this will take a while)... ${COL_DEFAULT}"
echo -e "${COL_LB}For recomended install type y (yes) when ever asked (Y/n) ${COL_DEFAULT}"

# ====== Step 2 ======
echo -e "${COL_LG}Starting step 2: changing RPi username, updating RPi and editing config file ${COL_DEFAULT}"
# Change the password
echo -e "${COL_LB}It is recommended that you change the password${COL_DEFAULT}"
echo -e "${COL_LB}Do you want to change the password? [Y/n] ${COL_LP}"
read yn
case $yn in
	[Yy]* ) sudo passwd;;
	[Nn]* ) echo -e "${COL_LR}It is not recommended to leave the default password ${COL_DEFAULT}";;
esac

# Need to get admin username and password (mainly for mysql) and system password (mysql)
echo -e "${COL_LB}Please enter the admin username you'd like to use for the database and server. ${COL_LP}"
read adminuser
echo -e "${COL_LB}Please enter the admin passowrd you'd like to use for the database and server. ${COL_LP}"
read adminpass
echo -e "${COL_LB}Please enter the Raspberry Pi password (needed for database config). ${COL_LP}"
read userpass

# Update the system
echo -e  "${COL_LB}Updating the Raspberry Pi's software${COL_DEFAULT}"
sudo apt-get -y update && sudo apt-get -y upgrade
echo ""

# Configure /boot/config.txt
echo -e "${COL_LB}Editing /bost/config.txt (raspi-config)${COL_DEFAULT}"
sudo sed -i 's/dtparam=spi=off/dtparam=spi=on/g' /boot/config.txt

echo""


# ====== Step 3 ======
echo -e "${COL_LG}Starting step 3: setting up the RTC ${COL_DEFAULT}"
# Setup RTC
echo -e "${COL_LB}Setting up real time clock (RTC)"
echo -e "${COL_LB}Make sure the RTC is connected as shown below (for DS3231): ${COL_DEFAULT}"
echo "    VCC (+) -> Pin 1 (3.3 V)"
echo "    D -> Pin 3 (SDA / GPIO 2)"
echo "    C -> Pin 5 (SCL / GPIO 3)"
echo "    NC -> Pin 7 (GPCLK0 / GPIO 4)"
echo "    - -> Pin 9 (Ground)"
echo -e "${COL_LB}Editing RTC files${COL_DEFAULT}"
sudo sed -i '$ a dtoverlay=i2c-rtc,ds3231' /boot/config.txt
sudo sed -i "s:if \[ -e /run/systemd/system \] ; then:#if \[ -e /run/systemd/system \] ; then:g" /lib/udev/hwclock-set
sudo sed -i "8s:exit 0:#exit 0:g" /lib/udev/hwclock-set
sudo sed -i "9s:fi:#fi:g" /lib/udev/hwclock-set
echo""

# ===== Step 4 =====
echo -e "${COL_LG}Starting step 4: Setting up node.js, downloading code and setting up radio ${COL_DEFAULT}"

# Downloading Repo
echo -e "${COL_LB}Downloading GitHub repo ${COL_DEFAULT}"
git clone https://github.com/BenSDuggan/RFID-Network.git
cd RFID-Network

# Setup Node.js
echo -e "${COL_LB}Installing node.js${COL_DEFAULT}"
curl -o nodejs.tar.gz https://nodejs.org/dist/v9.9.0/node-v9.9.0-linux-armv6l.tar.gz
tar -xzf nodejs.tar.gz
sudo cp -r node-v9.9.0-linux-armv6l/* /usr/local/
sed -i '$ a PATH=”$PATH:/usr/local/bin' ~/.profile

echo -e "${COL_LB}Granting priveleges to items in server folder${COL_DEFAULT}"
sudo chmod 777 server/outputCSV
cd server
chmod +x server.sh

echo -e "${COL_LB}Changing settings.json${COL_DEFAULT}"
sed -i "6s/.*/    \"user\":\"$adminuser\",/" settings.json
sed -i "7s/.*/    \"password\":\"$adminpass\"/" settings.json
sed -i "32s/.*/      \"username\":\"$adminuser\",/" settings.json
sed -i "33s/.*/      \"password\":\"$adminpass\"/" settings.json


echo -e "${COL_LB}Creating node app${COL_DEFAULT}"
#printf 'rfidnetwork\n1.0.0\nrfidnetwork\napp.js\n \n \n \n \n \nyes\n' | npm init
npm init -y
npm install express mysql socket.io winston

echo -e "${COL_LB}Installing nRF24 libraries${COL_DEFAULT}"
git clone https://github.com/tmrh20/RF24.git /home/pi/RFID-Network/server/RFIDNetworkPi/rf24libs/RF24
sudo make install -B -C RFIDNetworkPi/rf24libs/RF24

git clone https://github.com/tmrh20/RF24Network.git /home/pi/RFID-Network/server/RFIDNetworkPi/rf24libs/RF24Network
sudo make install -B -C RFIDNetworkPi/rf24libs/RF24Network

git clone https://github.com/tmrh20/RF24Mesh.git /home/pi/RFID-Network/server/RFIDNetworkPi/rf24libs/RF24Mesh
sudo make install -B -C RFIDNetworkPi/rf24libs/RF24Mesh

echo -e "${COL_LB}Installing python wrapper"
echo -e "${COL_LB}This will take a while and you won't see anything happening, but DON'T turn it off ${COL_DEFAULT}"

sudo apt-get -y install python-dev libboost-python-dev 
sudo ln -s /usr/lib/arm-linux-gnueabihf/libboost_python-py34.so /usr/lib/arm-linux-gnueabihf/libboost_python3.so 
sudo apt-get -y install python-setuptools 

echo -e "${COL_LB}Installing RF24 python wrapper${COL_DEFAULT}"
cd RFIDNetworkPi/rf24libs/RF24/pyRF24/
python setup.py build
sudo python setup.py install

echo -e "${COL_LB}Installing RF24Network python wrapper${COL_DEFAULT}"
cd pyRF24Network
python setup.py build
sudo python setup.py install

echo -e "${COL_LB}Installing RF24Mesh python wrapper${COL_DEFAULT}"
cd ../pyRF24Mesh
python setup.py build
sudo python setup.py install

echo -e "${COL_LB}Creating rfidnetwork service.${COL_DEFAULT}"
sudo bash -c 'echo "[Service]" >> /etc/systemd/system/rfidnetwork.service'
sudo sed -i "$ a ExecStart=$parDir/RFID-Network/server/server.sh" /etc/systemd/system/rfidnetwork.service

echo""


# ===== Step 5 =====
echo -e "${COL_LG}Starting step 5: Setting up MySQL database ${COL_DEFAULT}"
# Setup MySQL
echo -e "${COL_LB}Installing MySQL(MariaDB)${COL_DEFAULT}"
sudo apt-get -y install mysql-server

sudo mysql -uroot -p$userpass -e "GRANT ALL PRIVILEGES ON *.* TO '$adminuser'@'%' IDENTIFIED BY '$adminpass'";
sudo mysql -uroot -p$userpass -e "GRANT FILE ON *.* TO '$adminuser'@'%'";
sudo mysql -uroot -p$userpass -e "create database rfidnetwork";
sudo mysql -uroot -p$userpass rfidnetwork -e "CREATE TABLE birds (rfidTag VARCHAR(10), bandID VARCHAR(20), sex VARCHAR(20), age VARCHAR(20), taggedDateTime DATETIME, taggedLocation VARCHAR(50), comment TEXT, UNIQUE(rfidTag))";
sudo mysql -uroot -p$userpass rfidnetwork -e "CREATE TABLE boxes (box VARCHAR(20), reader VARCHAR(20), lat VARCHAR(20), lon VARCHAR(20), fieldSite VARCHAR(50), taggedDateTime VARCHAR(20), comment TEXT, currentDraw INT(11), currentSupply INT(11), UNIQUE(reader))";
sudo mysql -uroot -p$userpass rfidnetwork -e "CREATE TABLE readerdata (rfid VARCHAR(10), datetime DATETIME, reader VARCHAR(20), box VARCHAR(20), fieldSite VARCHAR(50))";

sudo mkdir /var/lib/mysql/csv
sudo chmod 777 /var/lib/mysql/csv

echo ""


# ===== Step 6 =====
echo -e "${COL_LG}Starting step 6: Setting up access point(AP) ${COL_DEFAULT}"
# Setup access point

echo -e "${COL_LB}Installing dnsmasq and hostapd${COL_DEFAULT}"
sudo apt-get -y install dnsmasq hostapd
sudo systemctl stop dnsmasq
sudo systemctl stop hostapd

echo -e "${COL_LB}Configuring /etc/dhcpcd.conf${COL_DEFAULT}"
sudo touch /etc/dhcpcd.conf
sudo sed -i '$ a interface wlan0' /etc/dhcpcd.conf
sudo sed -i '$ a static ip_address=10.3.141.1/24' /etc/dhcpcd.conf
sudo sed -i '$ a static routers=10.3.141.1' /etc/dhcpcd.conf
sudo sed -i '$ a static domain_name_server=1.1.1.1 8.8.8.8' /etc/dhcpcd.conf

echo -e "${COL_LB}Configuring /etc/dnsmasq.conf${COL_DEFAULT}"
sudo touch /etc/dnsmasq.conf
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig 
sudo cp $parDir/RFID-Network/server/ap/dnsmasq.conf /etc/dnsmasq.conf

echo -e "${COL_LB}Configuring /etc/hostapd/hostapd.conf${COL_DEFAULT}"
sudo cp $parDir/RFID-Network/server/ap/hostapd.conf /etc/hostapd/hostapd.conf

echo -e "${COL_LB}Configuring /etc/default/hostapd${COL_DEFAULT}"
sudo sed -i 's/#DAEMON_CONF=""/DAEMON_CONF="\/etc\/hostapd\/hostapd.conf"/g' /etc/default/hostapd

echo -e "${COL_LB}Configuring network tables${COL_DEFAULT}"
sudo sed -i 's/#net\.ipv4\.ip_forward=1/net\.ipv4\.ip_forward=1/g' /etc/sysctl.conf
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
sudo sed -i 's/exit 0/iptables-restore < \/etc\/iptables\.ipv4\.nat/g' /etc/rc.local
sudo sed -i '$ a exit 0' /etc/rc.local
	
echo""


echo -e "${COL_LG}Almost finished with installation.  The last step is to restart the RPi ${COL_DEFAULT}"
echo -e "${COL_LB}Do you want to restart now? [Y/n] ${COL_LP}" 
read yn
case $yn in
	[Yy]* ) sudo reboot;;
	[Nn]* ) echo -e "${COL_LR}You will need to restart before the system works. ${COL_DEFAULT}";;
esac

exit 0

changes needed
- Check problems with MySQL not generating correctly
- change settings.json
- add service to rc.local (maybe not needed)
