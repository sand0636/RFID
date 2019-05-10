# Installation guide
## Raspberry Pi setup
### What you need:
- A [Raspberry Pi](https://www.raspberrypi.org/).  Any Raspberry Pi (RPi) can be used but it must have wifi built in (W modles) or have a wifi module added.  The Raspberry Pi Zero W is recommended as it is readily available, has a built in wifi module and consumes a lower amount of power than other RPis.
- A SD or micro SD card (depending on which RPi you're using) over 8 GB for storage.
- A micro USB to USB A cable and USB to AC adaptor to power the RPi.
- A keyboard, mouse and monitor for the initial setup.
- A real time clock (RTC) module to keep track of time when not connected to a network.  We use the [DS3231 ](https://www.amazon.com/gp/product/B071JLYB5T/ref=oh_aui_detailpage_o04_s00?ie=UTF8&psc=1).
- nRF24L01+ to communicate with the readers.  It's best to use the long range nRF24L01+PA.  The nRF24 has unstable power out of the box so you need to add a [power module](https://www.amazon.com/Diymore-Adapter-NRF24L01-Wireless-Transceiver/dp/B06WD25F7V/ref=sr_1_9?ie=UTF8&qid=1536972918&sr=8-9&keywords=nrf24l01) ***WHICH USES 5V*** or solder a 0.1uF-1.0uF capacitor to VCC and GND ***WHICH USES 3.3V***.
- ***<span style="color:red;">Note:</span>*** if you're using the RPi Zero/RPi Zero W you probably need a micro USB to USB A adaptor, a USB hub and a mini-HDMI to HDMI.

### Setup:
Automatically install everything!! (still a work in progress):
1. Open the terminal on the Raspberry Pi
2. Type `git clone https://github.com/BenSDuggan/RFID-Network`
3. Type `cd RFID-Network` then `chmod +x install.sh`.
4. Finally type `./install.sh`


1. **Load operating system(OS) onto SD:**
    1. Follow the setup instructions on the [Raspberry Pi website](https://www.raspberrypi.org/downloads/) to install Raspbian, the RPi operating system.  It's easiest to install using Noobs.
    2. Connect the RPi to the internet using wifi by clicking on the wifi symbol in the upper right corner.
    3. The default username of the RPi is "pi".  You can change it if you wish but remember what ever it is set to.
2. **Update and configure permissions:**
    1. Open the terminal and type: `sudo apt-get update` then `sudo apt-get upgrade`
    2. The system configuration needs to be changed so type: `sudo raspi-config`
    3. If you haven't already changed the password you should do so to prevent people from messing with the system.  This password needs to be secure as anyone with this password has complete control of the system.  Select "Change User Password" and enter you secure password.
    4. Go back to the configuration page, enter the "Interface options", click on "SSH enable" and enable SSH.  This allows you to securely connect the the RPi on a computer on the network.
    5. Repeat step 4 but with "SPI".
3. **Setup the RTC:** Guide by [doughadfield](https://www.raspberrypi.org/forums/viewtopic.php?f=63&t=161133)
    1. The RTC should be wired as followed (assuming you're using the DS3231): VCC (+) -> Pin 1 (3.3 V); D -> Pin 3 (SDA / GPIO 2); C -> Pin 5 (SCL / GPIO 3); NC -> Pin 7 (GPCLK0 / GPIO 4); - -> Pin 9 (Ground)
    1. Type `sudo nano /boot/config.txt`, hold the down arror key until you get to the bottom of the file, press enter and type `dtoverlay=i2c-rtc,ds3231`, type `Ctrl or command + X`, `Y`, then enter.
    2. Type `sudo nano /lib/udev/hwclock-set` and find the lines that look like:
    ```
        if [ -e /run/systemd/system ] ; then
        exit 0
        fi
    ```
    Add a hashtag in front of each line so the lines look like:
    ```
        #if [ -e /run/systemd/system ] ; then
        #exit 0
        #fi
    ```
    3. Reboot the system by typing `sudo reboot`
    4. See if it worked by typing ` sudo hwclock -r` and checking that the time is correct.  If this doesn't work try looking for answers on [this forum post](https://www.raspberrypi.org/forums/viewtopic.php?f=63&t=161133) or try to find the manual for your RTC module.
4. **Node.js setup:**
    1. Install node by typing `cd ~` then `curl -o nodejs.tar.gz https://nodejs.org/dist/v9.9.0/node-v9.9.0-linux-armv6l.tar.gz`.
    2. Type `tar -xzf nodejs.tar.gz` then press enter.
    3. Next type `sudo cp -r node-v9.9.0-linux-armv6l/* /usr/local/`.
    4. Then type `sudo nano ~/.profile`, press the arrow key till you get to the bottom of the file, add `PATH=”$PATH:/usr/local/bin”`, press `Ctrl + x` then `y`.
    5. In the pi (default) directory type `git clone https://github.com/BenSDuggan/RFID-Network.git`.
    6. Type `cd RFID-Network` then `cd server`.
    7. Type `sudo chmod 777 outputCSV`.
    8. To allow the server to start automaticlly type `cd ~/RFID-Network/server` `npm init` and enter the following when prompted:
        1. package name: rfidnetwork
        2. version: press enter
        3. description: press enter
        4. entry point: app.js
        5. test command: enter
        6. git repository: enter
        7. keywords: enter
        8. author: enter
        9. license: enter
        10. Is this ok? enter
    9. Now type `npm install express mysql socket.io winston`.
    10. Type `sudo npm install forever -g && sudo npm install forever-service -g`.
    11. Next type `sudo forever-service install RFIDNetwork`.
    12. Now lets setup the radio in software.  Type `cd RFIDNetworkPi`.
    13. ~~Next type `wget http://tmrh20.github.io/RF24Installer/RPi/install.sh `.~~
    14. Type `chmod +x install.sh` then `./install.sh`.  Type `y` when ever asked to except for the last prompt 'Do you want to build an RF24Gateway example?' when you should type `n`.
    15. Type `mkdir saves` then `rm main` then `make`.
    16. Then type `sudo nano /etc/rc.local`, press the arrow key till you get to the bottom of the file, add `sudo service RFIDNetwork start`  and on a new line `sudo /home/pi/RFID-Network/server/RFIDNetworkPi/main &` before `exit 0`, press `Ctrl + x` then `y`.
    17. vim /etc/systemd/system/rfidnetwork.service
    18. sudo systemctl start rfidnetwork

5. **MySQL/MariaDB database setup:**
    1. A MySQL database is used to store the data on the RPi.  To install it enter `sudo apt-get install mysql-server` into the terminal.
    2. Type `sudo mysql_secure_installation` to setup MySQL
    3. Inside the "mysql_secure_installation" command line perform the following steps
        1. Press enter when you see "Enter current password for root".
        2. Enter Y to "Set root password?"
        3. Set a new password.  This will be the **root** password to the database.  You need to keep this private and make sure that it is secure.
        4. Enter Y to "Remove anonymous users?"
        5. Enter n to "Disallow root login remotely?"
        6. Enter Y to "Remove test database and access to it?"
        7. Enter Y to "Reload privilege tables now?"
    4. To get into the MySQL command line type `sudo mysql -uroot -pyour_password` where "your_password" is your root password.
    5. To give yourself permissions type `GRANT ALL PRIVILEGES ON *.* TO 'your_username'@'%' IDENTIFIED BY 'your_password';`, where "your_username" is a NEW non-root username and "your_password" is a NEW non-root password.  Make sure you keep the apostrophes.
    6. To give yourself permission to output the database type `GRANT FILE ON *.* TO 'your_username'@'%';`, where "your_username" is your non-root username.  Again, make sure you keep the apostrophes.
    7. Type `create database rfidnetwork;` then `use rfidnetwork;`.
    8. Create the birds table by typing `CREATE TABLE birds (rfidTag VARCHAR(10), bandID VARCHAR(20), sex VARCHAR(20), age VARCHAR(20), taggedDateTime DATETIME, taggedLocation VARCHAR(50), comment TEXT, UNIQUE(rfidTag));`.
    9. Create the box table by typing `CREATE TABLE boxes (box VARCHAR(20), reader VARCHAR(20), lat VARCHAR(20), lon VARCHAR(20), fieldSite VARCHAR(50), taggedDateTime VARCHAR(20), comment TEXT, currentDraw INT(11), currentSupply INT(11), UNIQUE(reader));`.
    10. Create the reads table by typing `CREATE TABLE readerdata (rfid VARCHAR(10), datetime DATETIME, reader VARCHAR(20), box VARCHAR(20), fieldSite VARCHAR(50));`.
    11. Exit out of the MySQL command line by typing `exit;` and then enter `sudo mkdir /var/lib/mysql/csv` followed by `sudo chmod 777 /var/lib/mysql/csv` in the terminal window.
6. **Wireless access point setup:** This is a combined protocal using the steps from https://github.com/SurferTim/documentation/blob/6bc583965254fa292a470990c40b145f553f6b34/configuration/wireless/access-point.md and .conf files from https://github.com/billz/raspap-webgui
    1. Type `sudo apt-get -y install dnsmasq hostapd`.
    2. Type `sudo systemctl stop dnsmasq` and `sudo systemctl stop hostapd`.
    2. Type `sudo nano /etc/dhcpcd.conf` and go to the bottom of the document.
    3. Add the following lines to the bottom of the file:
        ```
        interface wlan0
        static ip_address=10.3.141.1/24
        static routers=10.3.141.1
        static domain_name_server=1.1.1.1 8.8.8.8
        ```
        Then type Ctrl+x, y, enter.
    4. Type `sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig `.
    5. Type `sudo nano /etc/dnsmasq.conf`.
    6. Add the following lines to the bottom of the file:
        ```
        domain-needed
        interface=wlan0
        dhcp-range=10.3.141.50,10.3.141.255,255.255.255.0,24h
        ```
        Then type Ctrl+x, y, enter.
    7. Type `/etc/hostapd/hostapd.conf`.
    8. Add the following lines to the bottom of the file:
        ```
        driver=nl80211
        ctrl_interface=/var/run/hostapd
        ctrl_interface_group=0
        beacon_int=100
        auth_algs=1
        wpa_key_mgmt=WPA-PSK
        ssid=RFIDNetwork
        channel=1
        hw_mode=g
        wpa_passphrase=ChangeThis
        interface=wlan0
        wpa=1
        wpa_pairwise=TKIP
        ```
        Then type Ctrl+x, y, enter.
    9. Type `sudo nano /etc/default/hostapd`.
    10. Change `#DAEMON_CONF=""` to `DAEMON_CONF="/etc/hostapd/hostapd.conf`.  Then type Ctrl+x, y, enter.
    11. Type `sudo nano /etc/sysctl.conf`.
    10. Change `#net.ipv4.ip_forward=1` to `net.ipv4.ip_forward=1`.  Then type Ctrl+x, y, enter.
    11. Type `iptables-save > /etc/iptables.ipv4.nat`.
    12. Type `sudo nano /etc/rc.local`.
    13. Add `iptables-restore < /etc/iptables.ipv4.nat` above `exit 0`.
    14. By default the access point will be started when the RPi is restarted.  The WiFi name is `RFIDNetwork` and the default password is `ChangeThis`.

7. **Install nRF24 radio:**
    1. Make sure that your RPi has headers (the 40 pins running in a row of 2) soldered on.  If you have a RPi Zero then you will probably need to solder the GPIO header onto the board.
    2. Using female to female headers, connect the nRF24L01+ with the power solution to the arduino using the following diagram, it may help to reference the RPi's pins on [pinout.xyz](https://pinout.xyz/):
    **Make sure you connect the VCC pin to the correct voltage level or you can damage the chip**
    
    | Power module(5.0V) | Capacity (3.3V) |
    | ----------- | ----------- |
    | 1)GND -> Pin 20 | 1)GND -> Pin 20 |
    | ***2)VCC -> Pin 4*** | ***2)VCC -> Pin 17*** |
    | 3)CE -> Pin 22(GPIO 25) | 3)CE -> Pin 22(GPIO 25) |
    | 4)CSN -> Pin 24 | 4)CSN -> Pin 24 |
    | 5)SCK -> Pin 23(GPIO 11) | 5)SCK -> Pin 23(GPIO 11) |
    | 6)MOSI -> Pin 19(GPIO 10) | 6)MOSI -> Pin 19(GPIO 10) |
    | 7)MISO -> Pin 21(GPIO 9) | 7)MISO -> Pin 21(GPIO 9) |
    | 8)IRQ -> nothing | 8)IRQ -> nothing |
    
8. **Test the system:**
    1. By default the access point will be started when the RPi is restarted.  The WiFi name is `RFIDNetwork` and the default password is `ChangeThis`.
    2. If you're on the RPi then open a web browser and go to localhost:4000.  You should see a website appear with the title "RFIDNetwork".  You can also connect to the RPis wifi network and go to 10.3.141.1:4000 on a web browser.
    3. Try creating a bird or reader.  If this is done successfully and stays on the page after you refresh then the RPi should be set up.
    4. Next it is recomended that you change the WiFi password by going to the settings tab.
