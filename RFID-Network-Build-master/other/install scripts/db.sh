#!/bin/bash

# Define colors used in the script
COL_DEFAULT='\033[0;37'
COL_LG='\033[1;32'
COL_LB='\033[1;34'
COL_LR='\033[1;31'


echo -e "${COL_LB} Starting installation (this will take a while)... ${COL_DEFAULT}"
echo -e "${COL_LB} For recomended install type y (yes) when ever asked (Y/n) ${COL_DEFAULT}"

echo -e "Please enter the admin username you'd like to use for the database and server."
read adminuser
echo -e "Please enter the admin passowrd you'd like to use for the database and server."
read adminpass
echo -e "Please enter the Raspberry Pi password (needed for database config)."
read userpass




# ===== Step 5 =====
echo -e "${COL_LG} Starting step 5: Setting up MySQL database ${COL_DEFAULT}"
# Setup MySQL
echo -e "Installing MySQL(MariaDB)"
sudo apt-get -y install mysql-server

sudo mysql -uroot -p$userpass -e "GRANT ALL PRIVILEGES ON *.* TO '$adminuser'@'%' IDENTIFIED BY 'adminpass'";
sudo mysql -uroot -p$userpass -e "GRANT FILE ON *.* TO '$adminuser'@'%'";
sudo mysql -uroot -p$userpass -e "create database rfidnetwork";
sudo mysql -uroot -p$userpass rfidnetwork -e "CREATE TABLE birds (rfidTag VARCHAR(10), bandID VARCHAR(20), sex VARCHAR(20), age VARCHAR(20), taggedDateTime DATETIME, taggedLocation VARCHAR(50), comment TEXT, UNIQUE(rfidTag))";
sudo mysql -uroot -p$userpass rfidnetwork -e "CREATE TABLE boxes (box VARCHAR(20), reader VARCHAR(20), lat VARCHAR(20), lon VARCHAR(20), fieldSite VARCHAR(50), taggedDateTime VARCHAR(20), comment TEXT, currentDraw INT(11), currentSupply INT(11), UNIQUE(reader))";
sudo mysql -uroot -p$userpass rfidnetwork -e "CREATE TABLE readerdata (rfid VARCHAR(10), datetime DATETIME, reader VARCHAR(20), box VARCHAR(20), fieldSite VARCHAR(50))";

sudo mkdir /var/lib/mysql/csv
sudo chmod 777 /var/lib/mysql/csv

echo""



echo -e "${COL_LG} Almost finished with installation.  The last step is to restart the RPi ${COL_DEFAULT}"
read -p "Do you want to restart now? [Y/n]" yn
case $yn in
	[Yy]* ) sudo reboot;;
	[Nn]* ) echo -e "${COL_LR} You will need to restart before the system works. ${COL_DEFAULT}";;
esac
