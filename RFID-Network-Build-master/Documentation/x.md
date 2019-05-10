# Don't know what to call this
This file is where I place commands and code that I've had to deal with a lot always forget.

## Connect to WiFi through terminal
`sudo nano /etc/wpa_supplicant/wpa_supplicant.conf`
Add line at end with following format (including quotes)
```
network={
    ssid="ssid"
    psk="password"
}
```
Restart wifi by using `sudo wpa_cli -i wlan0 reconfigure`
If it responds ok then it should be good, else reboot :(

## Reliable access point
