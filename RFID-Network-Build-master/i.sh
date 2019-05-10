#!/bin/bash


# Configure /boot/config.txt
echo "Editing /bost/config.txt (raspi-config)"
sudo sed -i 's/dtparam=spi=off/dtparam=spi=on/g' /boot/config.txt

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
sudo sed -i '$ a dtoverlay=i2c-rtc,ds3231' /boot/config.txt
sudo sed -i "s:if \[ -e /run/systemd/system \] ; then:#if \[ -e /run/systemd/system \] ; then:g" /lib/udev/hwclock-set
sudo sed -i "8s:exit 0:#exit 0:g" /lib/udev/hwclock-set
sudo sed -i "9s:fi:#fi:g" /lib/udev/hwclock-set


sudo sed -i '$ a PATH=”$PATH:/usr/local/bin' ~/.profile

	






