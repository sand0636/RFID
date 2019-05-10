# suggestions

Here are a list of suggestions and useful hints when using this project.

## server
- If you are just wanting to interface with the server it is easiest to install mysql and node.js on a laptop or desktop.  You won't be able to add reads with an arduino but it helps with development or trying to learn the system.
- If you are on a personal WiFi network (university networks often prevent this) it is easiest to uninstall the access point, `sudo apt-get remove hostapd && sudo apt-get remove dnsmasq`, and access the server over your personal WiFi network.  This allows you to stay connected to the internet and currently (10/3/18) the access point still has some problems.  To find your RPi's IP on a network type `ifconfig` in the terminal and copy the IP address of the "wlan0" IP.
- In stead of using the terminal on the RPi by connecting to it with HDMI, keyboard and mouse, it is easier to use SSH.  You can do this using a RPi connected to a WiFi network or in access point mode but you need to know its IP address (see above point).  On windows you need to download putty to connect to the RPi but you can use terminal on mac or linux to start an SSH session.  Additionally, you can drag and drop files from the RPi by using SFTP.  This can be done on windows by downloading WinSCP (not sure how to do it on mac or linux; maybe filezilla?).
- 