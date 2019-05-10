#!/bin/bash

# Define colors used in the script
COL_DEFAULT='\033[0;37'
COL_LG='\033[1;32'
COL_LB='\033[1;34'
COL_LR='\033[1;31'


echo -e "${COL_LB} Starting installation (this will take a while)... ${COL_DEFAULT}"
echo -e "${COL_LB} For recomended install type y (yes) when ever asked (Y/n) ${COL_DEFAULT}"

# ===== Step 4 =====
# Setup Node.js
echo -e "${COL_LG} Starting step 4: Setting up node.js, downloading code and setting up radio ${COL_DEFAULT}"
echo -e "Installing node.js"
cd ~
curl -o nodejs.tar.gz https://nodejs.org/dist/v9.9.0/node-v9.9.0-linux-armv6l.tar.gz
tar -xzf nodejs.tar.gz
sudo cp -r node-v9.9.0-linux-armv6l/* /usr/local/
sed -i '$ a PATH=”$PATH:/usr/local/bin' ~/.profile


echo -e "Creating node app"
#printf 'rfidnetwork\n1.0.0\nrfidnetwork\napp.js\n \n \n \n \n \nyes\n' | npm init
npm init -y
npm install express mysql socket.io winston

echo""


# ===== Step 5 =====
echo -e "${COL_LG} Starting step 5: Setting up MySQL database ${COL_DEFAULT}"
# Setup MySQL


echo""

# ===== Step 6 =====
echo -e "${COL_LG} Starting step 6: Setting up access point(AP) ${COL_DEFAULT}"
# Setup access point

echo""



