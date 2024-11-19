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
TinyGPSPlus gps;
SoftwareSerial gsmSerial(GSM_RX_PIN, GSM_TX_PIN);
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN); // Define gpsSerial for GPS communication

// Variables for MAX30105
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute;
int beatAvg;
int spO2Value;
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int bufferIndex = 0; // Index for storing sensor data
int32_t spo2;
int8_t validSpO2;
int32_t heartRate;
int8_t validHeartRate;

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
    Serial.println("\nRescue Ranger Device Starting...");

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
    if (!particleSensor.begin(Wire, 100000)) { // Use standard I2C speed of 100kHz
        Serial.println("MAX30105 not found!");
        while (1) {
            delay(100);
            Serial.println("Check sensor connection...");
        }
    }

    Serial.println("MAX30105 initialized successfully");
  
    particleSensor.setup(60, 4, 2, 200, 411, 4096); // Ensure this matches your library's API
    particleSensor.setPulseAmplitudeRed(0x0A); // Ensure this matches your library's API
    particleSensor.setPulseAmplitudeGreen(0);   // Ensure this matches your library's API
}

void initGSM() {
    Serial.println("Initializing GSM...");
  
    gsmSerial.println("AT");
    delay(1000);
  
    gsmSerial.println("AT+CMGF=1"); // Set SMS text mode
    delay(1000);
  
    gsmSerial.println("AT+CNMI=1,2,0,0,0"); // Configure SMS notifications
    delay(1000);
  
    Serial.println("GSM initialized");
}

void initCellular() {
    Serial.println("Initializing Cellular...");
    
    gsmSerial.println("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\""); 
    delay(100);
    
    gsmSerial.print("AT+SAPBR=3,1,\"APN\",\"");
    gsmSerial.print(APN);
    gsmSerial.println("\"");
    delay(100);

    gsmSerial.print("AT+SAPBR=1,1"); 
    delay(3000); // Wait for connection
    
    gsmSerial.println("AT+CIICR"); // Bring up wireless connection
    delay(3000); 
    
    Serial.println("Cellular initialized");
}

void readSensors() {
    particleSensor.check();  
    
    while (particleSensor.available()) {
        redBuffer[bufferIndex] = particleSensor.getRed(); // Ensure these methods exist in your library
        irBuffer[bufferIndex] = particleSensor.getIR();   // Ensure these methods exist in your library
        particleSensor.nextSample();                        // Ensure this method exists in your library
        
        maxim_heart_rate_and_oxygen_saturation(
            irBuffer, bufferIndex + 1, redBuffer, &spo2, &validSpO2, &heartRate, &validHeartRate
        );
        
        if (validHeartRate && validSpO2) {
            beatAvg = heartRate;
            spO2Value = spo2;
        }
        bufferIndex++;
        if (bufferIndex >= 100) bufferIndex = 0; // Reset buffer index if it exceeds the size
    }
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
    doc["spO2"] = spO2Value;
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
        spO2Value < 95;

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
    message += "SpO2: " + String(spO2Value) + "%\n";
    message += "Location: http://maps.google.com/?q=" + String(latitude, 6) + "," + String(longitude, 6);

    gsmSerial.print(message);
    
    delay(100);

    gsmSerial.write(26); // Ctrl+Z to send SMS
    delay(1000);

    Serial.println("Emergency SMS sent");
}

float getBatteryVoltage()
{
    return analogRead(A0) * (4.2 / 1023.0); // Mock battery voltage calculation
}

void updateBatteryLevel() {
    float voltage = getBatteryVoltage();
    
    batteryLevel = ((voltage - 3.3) / (4.2 - 3.3)) * 100; 
    
    if (batteryLevel > 100) batteryLevel = 100; 
    
    if (batteryLevel < 0) batteryLevel = 0; 
}

