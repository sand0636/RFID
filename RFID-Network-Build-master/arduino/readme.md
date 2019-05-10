# arduino

This is where the arduino code that allows reader data to be entered into the system is contained.  Curently the RFIDNetwork.h and RFIDNetwork.cpp files are architecture specific (there is a version for the SAMD ETag and AVR nano).  This should be changing soon.

## File structure
- Individual components: The code used to build these programms.
- Other programs: Other versions of the RFIDNetwork code including code that makes the ETag go to sleep.
- RFIDNetwork: Where the new features are added and tested and examples of each method are found.
- RFIDNetworkGen2: The code that works with the Gen 2 readers.  The code is designed to be used with an ***AVR*** board and uses a RS232 to TTL converter to get the RFID tags off of the reader.
- RFIDNetworkETag: The code that works with the ETag readers.
- sendOnInterval: Arduino code for AVR and SAMD (ETag) boards that sends a read to the server ever x milliseconds (currently 1000).