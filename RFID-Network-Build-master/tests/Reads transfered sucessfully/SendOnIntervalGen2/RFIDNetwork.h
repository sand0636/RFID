#include "RF24.h"
#include "RF24Network.h"
#include "RF24Mesh.h"
#include <TimeLib.h>

class RFIDNetwork {
  private:
    RF24& radio;
    RF24Network& network;
    RF24Mesh& mesh;
    static const uint8_t readsCacheSize = 10;
    char reads[readsCacheSize][21];
    unsigned short numberOfReads = 0;
    uint8_t readNumber = 0;
    bool usingGlobalTimer = true;
    long clockInitialTimeFreq = 500;
    long clockExpiredTime = 15000; //How often should the clock time be updated
    long clockExpiredTimeCounter = 0; //Counter for keepingtrack of when it's time to update the time
    bool usingTimeLib = true;
    bool timeNeedsSetting = true;
    void removeRead(uint8_t _readNumber);
    long lastMillis;
    uint16_t retryTime = 300;
    bool sleepSent = false;
    bool sleeping = false;
    uint16_t sleepTill = 0;

  public:
    RFIDNetwork(RF24& _radio, RF24Network& _network, RF24Mesh& _mesh);
    void setID(uint8_t _id);
    void begin();
    uint8_t* update();
    void newRead(char *_rfidTag);
    void newRead(char *_rfidTag, long _t);
    void sleep();
    void awake();
    void useGlobalTimer(bool _use);
    void makeTime(time_t _t);
    void makeTime(byte _hr, byte _min, byte _sec, byte _day, byte _month, byte _yr);
    long getTime();
};

