#!/bin/bash

# Define colors used in the script
COL_DEFAULT='\033[0;37m'
COL_LG='\033[1;32m'
COL_LB='\033[1;34m'
COL_LR='\033[1;31m'


echo -e "${COL_LB} Starting installation (this will take a while)... ${COL_DEFAULT}"
echo -e "${COL_LB} For recomended install type y (yes) when ever asked (Y/n) ${COL_DEFAULT}"

# ===== Step 6 =====
echo -e "${COL_LG} Starting step 6: Setting up access point(AP) ${COL_DEFAULT}"
# Setup access point

echo -e "Installing dnsmasq and hostapd"
sudo apt-get -y install dnsmasq hostapd
sudo systemctl stop dnsmasq
sudo systemctl stop hostapd

echo -e "Configuring /etc/dhcpcd.conf"
sudo touch /etc/dhcpcd.conf
sudo sed -i '$ a interface wlan0' /etc/dhcpcd.conf
sudo sed -i '$ a static ip_address=10.3.141.1/24' /etc/dhcpcd.conf
sudo sed -i '$ a static routers=10.3.141.1' /etc/dhcpcd.conf
sudo sed -i '$ a static domain_name_server=1.1.1.1 8.8.8.8' /etc/dhcpcd.conf

echo -e "Configuring /etc/dnsmasq.conf"
sudo touch /etc/dnsmasq.conf
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig 
sudo cp /home/pi/RFID-Network/server/ap/dnsmasq.conf /etc/dnsmasq.conf

echo -e "Configuring /etc/hostapd/hostapd.conf"
sudo cp /home/pi/RFID-Network/server/ap/hostapd.conf /etc/hostapd/hostapd.conf

echo -e "Configuring /etc/default/hostapd"
sudo sed -i 's/#DAEMON_CONF=""/DAEMON_CONF="\/etc\/hostapd\/hostapd.conf"/g' /etc/default/hostapd

echo -e "Configuring network tables"
sudo sed -i 's/#net\.ipv4\.ip_forward=1/net\.ipv4\.ip_forward=1/g' /etc/sysctl.conf
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
sudo sed -i 's/exit 0/iptables-restore < \/etc\/iptables\.ipv4\.nat/g' /etc/rc.local
sudo sed -i '$ a exit 0' /etc/rc.local
	
echo""


echo -e "${COL_LG} Almost finished with installation.  The last step is to restart the RPi ${COL_DEFAULT}"
read -p "Do you want to restart now? [Y/n]" yn
case $yn in
	[Yy]* ) sudo reboot;;
	[Nn]* ) echo -e "${COL_LR} You will need to restart before the system works. ${COL_DEFAULT}";;
esac

