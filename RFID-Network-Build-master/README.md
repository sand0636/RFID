# RFID-Network
An opensource system for wirelessly collecting, monitoring and analyzing RFID data.  The goal of the system to provide a way to collect data off of RFID readers wirellsy, store them on a server and provide annalysis and managment tool for that data.

# Abstract
Cost-effective radio frequency identification (RFID) technology allows biologists to track the movement of tagged animals using short range antennas. Current reader designs generally record data to memory cards, to be manually uploaded and analyzed on a computer. While this approach may be sufficient for some projects, it does not lend itself to the deployment of large numbers of readers over large geographical areas, without significant logistical drawbacks. Here, we have created a system that wirelessly collects data from readers, stores data on a central server, and transmits data over a locally-generated Wi-Fi network to allow for real-time viewing and basic analysis on a computer or mobile device. This system uses a Raspberry Pi mini-computer, an Arduino board, and a transceiver radio module on every device in the RFID network. We will present the results of simulated and real-world tests of this system to validate radio range, ensure reliability of data transfer, and measure effects on battery life. Furthermore, we elaborate on additional features, such as networking radios together to increase range and integrating mobile hotspots to allow remote data access. This system can facilitate new, ambitious experiments that further extend the scope of behavioral questions that can be answered using RFID technology.

<p align="center">
<img src="/Documentation/images/website/webpage-analytics-filter,bird,reader.png" width="450" />
</p>

# Repository structure
```
├── arduino                 	# Scripts uploded to the arduino to communicate between the RFID reader and server
    ├── Individual components   # Individual arduino scripts used for assembling the bigger script
    ├── Other programs          # Different versions of the RFIDNetwork script that can do advanced things like sleep
    ├── RFIDNetwork             # Basic template for implimenting RFIDNetwork protocal
    ├── RFIDNetworkETAG         # Example script of RFIDNetwork integrated on ETAG
    ├── RFIDNetworkGen2         # Example script of RFIDNetwork integrated on Gen. 2
    └── SendOnInterval          # Script that sends read ever x milliseconds to test system
├── additional_code				# More useful scripts for this project
├── Documentation               # Contains project documentation including the installation guide
├── server                      # Code ran on the RPi including node website and radio script
├── tests                       # Test code and results to validate the system
└── install.sh                  # Script used to automatically install server content
```

# Installation guide
To install the system open the user guide found in Documentation->RFIDNetwork User Manual->RFIDNetwork User Manual.pdf and read section 2) Installation.

# Acknowledgements
People: Eli Bridge, Chris Tyson and Connor Altic
Funding: Hutton Honors College Undergraduate Research Partnership and Travel grant, Indiana University Research Teaching Preserve

# ToDo
* Ping nodes and get transfer speed
* Display node data on reader webpage (allow to ping nodes)
* Remove dead readers
* Map
* Add headers to sql downloads
* Make it so sql downloads are in root directory of zip - TEST
* Work on security (SQL injections)

Short install URL: https://bit.ly/2CCI6Ok