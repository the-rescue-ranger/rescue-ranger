#include <SoftwareSerial.h>
#include <Wire.h>
#include <TinyGPS++.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <spo2_algorithm.h>
#include <ArduinoJson.h>

// SIM800L Configuration
const char* APN = "internet"; // Replace with your cellular APN
const char* USERNAME = ""; // Usually empty
const char* PASSWORD = ""; // Usually empty

// Server Configuration
const char* SERVER_URL = "rescue-ranger-server.onrender.com"; // Server URL without "http://"
const String DEVICE_ID = "DEVICE_001"; // Unique ID for this device

// Pin Definitions
const int GSM_RX_PIN = D1;  // Connect to SIM800L TX
const int GSM_TX_PIN = D2;  // Connect to SIM800L RX
const int GPS_RX_PIN = D3;  // Connect to GPS TX
const int GPS_TX_PIN = D4;  // Connect to GPS RX

// I2C Pin Definitions for MAX30105
const int SDA_PIN = D6;     // Define SDA pin
const int SCL_PIN = D5;     // Define SCL pin

// Emergency Contact
const char* EMERGENCY_PHONE = "+919425477596";

// Objects
MAX30105 particleSensor;
TinyGPSPlus gps; // Declare the gps object
SoftwareSerial gsmSerial(GSM_RX_PIN, GSM_TX_PIN);
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN); // Define gpsSerial for GPS communication

// Variables for MAX30105
#define MAX_BRIGHTNESS 255
uint32_t irBuffer[100]; // Infrared LED sensor data
uint32_t redBuffer[100]; // Red LED sensor data
int32_t bufferLength; // Data length
int32_t spo2; // SPO2 value
int8_t validSPO2; // Indicator to show if the SPO2 calculation is valid
int32_t heartRate; // Heart rate value
int8_t validHeartRate; // Indicator to show if the heart rate calculation is valid
const byte RATE_SIZE = 4; // Increase this for more averaging. 4 is good.
byte rates[RATE_SIZE]; // Array of heart rates
byte rateSpot = 0;
long lastBeat = 0; // Time at which the last beat occurred
float beatsPerMinute;
int beatAvg;

// GPS variables
float latitude = 0;
float longitude = 0;
bool validLocation = false;

// Timing variables
unsigned long lastReadingTime = 0;
unsigned long lastServerUpdateTime = 0;
const unsigned long READ_INTERVAL = 1000;    // Read sensors every 1 second
const unsigned long UPDATE_INTERVAL = 5000;  // Send to server every 5 seconds

// Status variables
bool isEmergency = false;
int batteryLevel = 100;  // Mock battery level

void setup() {
    Serial.begin(115200);
    Serial.println("\nRes cue Ranger Device Starting...");

    gsmSerial.begin(9600);
    gpsSerial.begin(9600); // Initialize GPS serial communication
    
    Wire.begin(SDA_PIN, SCL_PIN); // Initialize I2C with defined SDA and SCL pins

    initMAX30105();
    initGSM();
    initCellular();
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - lastReadingTime >= READ_INTERVAL) {
        lastReadingTime = currentMillis;
        readSensors();
    }

    if (currentMillis - lastServerUpdateTime >= UPDATE_INTERVAL) {
        lastServerUpdateTime = currentMillis;
        sendDataToServer();
    }

    while (gpsSerial.available() > 0) {
        if (gps.encode(gpsSerial.read())) {
            updateGPSData();
        }
    }

    checkAndHandleEmergency();

    yield();
}

void initMAX30105() {
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) { // Use default I2C port, 400kHz speed
        Serial.println("MAX30105 not found!");
        while (1) {
            delay(100);
            Serial.println("Check sensor connection...");
        }
    }

    Serial.println("MAX30105 initialized successfully");
  
    byte ledBrightness = 60; // Options: 0=Off to 255=50mA
    byte sampleAverage = 4; // Options: 1, 2, 4, 8, 16, 32
    byte ledMode = 2; // Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
    byte sampleRate = 100; // Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
    int pulseWidth = 411; // Options: 69, 118, 215, 411
    int adcRange = 4096; // Options: 2048, 4096, 8192, 16384

    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange); // Configure sensor with these settings
}

void initGSM() {
    // Initialize GSM module
    gsmSerial.println("AT");
    delay(1000);
    gsmSerial.println("AT+CPIN?"); // Check SIM card status
    delay(1000);
    gsmSerial.println("AT+CREG?"); // Check network registration
    delay(1000);
    gsmSerial.println("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\""); // Set connection type
    delay(1000);
    gsmSerial.println("AT+SAPBR=3,1,\"APN\",\"" + String(APN) + "\""); // Set APN
    delay(1000);
    gsmSerial.println("AT+SAPBR=1,1"); // Open bearer
    delay(1000);
}

void initCellular() {
    // Ensure cellular connection is established
    gsmSerial.println("AT+CSQ"); // Check signal quality
    delay(1000);
    gsmSerial.println("AT+CREG?"); // Check network registration
    delay(1000);
}

void readSensors() {
    long irValue = particleSensor.getIR();

    if (checkForBeat(irValue) == true) {
        // We sensed a beat!
        long delta = millis() - lastBeat;
        lastBeat = millis();

        beatsPerMinute = 60 / (delta / 1000.0);

        if (beatsPerMinute < 255 && beatsPerMinute > 20) {
            rates[rateSpot++] = (byte)beatsPerMinute; // Store this reading in the array
            rateSpot %= RATE_SIZE; // Wrap variable

            // Take average of readings
            beatAvg = 0;
            for (byte x = 0; x < RATE_SIZE; x++)
                beatAvg += rates[x];
            beatAvg /= RATE_SIZE;
        }
    }

    // Read the first 100 samples, and determine the signal range
    for (byte i = 0; i < 100; i++) {
        while (particleSensor.available() == false) // Do we have new data?
            particleSensor.check(); // Check the sensor for new data

        redBuffer[i] = particleSensor.getRed();
        irBuffer[i] = particleSensor.getIR();
        particleSensor.nextSample(); // We're finished with this sample so move to next sample
    }

    // Calculate heart rate and SpO2 after first 100 samples (first 4 seconds of samples)
    maxim_heart_rate_and_oxygen_saturation(irBuffer, 100, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
}

void updateGPSData() {
    if (gps.location.isValid()) {
        latitude = gps.location.lat();
        longitude = gps.location.lng();
        validLocation = true;
    }
}

void sendDataToServer() {
    if (!isCellularConnected()) {
        Serial.println("Cellular not connected. Attempting reconnection...");
        initCellular(); // Attempt to reconnect
        return;
    }

    StaticJsonDocument<200> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["heartRate"] = beatAvg;
    doc["spO2"] = spo2;
    doc["location"]["latitude"] = latitude;
    doc["location"]["longitude"] = longitude;
    doc["batteryLevel"] = batteryLevel;
    doc["timestamp"] = millis();

    String jsonString;
    serializeJson(doc, jsonString);

    gsmSerial.print("AT+CIPSTART=\"TCP\",\"");
    gsmSerial.print(SERVER_URL);
    gsmSerial.println("\",80");
    delay(2000);

    gsmSerial.println("AT+CIPSEND");
    delay(2000);

    gsmSerial.print("POST / HTTP/1.1\r\n");
    gsmSerial.print("Host: ");
    gsmSerial.print(SERVER_URL);
    gsmSerial.print("\r\n");
    gsmSerial.print("Content-Type: application/json\r\n");
    gsmSerial.print("Content-Length: ");
    gsmSerial.print(jsonString.length());
    gsmSerial.print("\r\n\r\n");
    
    gsmSerial.print(jsonString);
    
    delay(2000); // Wait for server response
    
    Serial.println("Data sent to server.");
}

bool isCellularConnected() {
    gsmSerial.println("AT+SAPBR?"); 
    delay(100);
    String response;

    while(gsmSerial.available()) {
        response += char(gsmSerial.read());
    }

    return response.indexOf("1") != -1; // Check if connected
}

void checkAndHandleEmergency() {
    bool currentEmergency =
        beatAvg < 60 || 
        beatAvg > 100 || 
        spo2 < 95;

    if (currentEmergency && !isEmergency) {
        isEmergency = true;
        sendEmergencySMS();
    }

    if (!currentEmergency && isEmergency) {
        isEmergency = false;
    }
}

void sendEmergencySMS() {
    Serial.println("Sending emergency SMS...");

    gsmSerial.print("AT+CMGS=\"");
    gsmSerial.print(EMERGENCY_PHONE);
    gsmSerial.println("\"");
    delay(1000);

    String message = "EMERGENCY ALERT!\n";
    message += "Person needs attention!\n";
    message += "Heart Rate: " + String(beatAvg) + " BPM\n";
    message += "SpO2: " + String(spo2) + "%\n";
    message += "Location: http://maps.google.com/?q=" + String(latitude, 6) + "," + String(longitude, 6);

    gsmSerial.print(message);
    
    delay(100);

    gsmSerial.write(26); // Ctrl+Z to send SMS
    delay(1000);

    Serial.println("Emergency SMS sent");
}

float getBatteryVoltage() {
    return analogRead(A0) * (4.2 / 1023.0); // Mock battery voltage calculation
}

void updateBatteryLevel() {
    float voltage = getBatteryVoltage();
    
    batteryLevel = ((voltage - 3.3) / (4.2 - 3.3)) * 100; 
    
    if (batteryLevel > 100) batteryLevel = 100; 
    
    if (batteryLevel < 0) batteryLevel = 0; 
}
