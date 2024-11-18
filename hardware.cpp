#include <SoftwareSerial.h>
#include <Wire.h>
#include <TinyGPS++.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <spo2_algorithm.h>

// Server Configuration
const char* SERVER_URL = "https://rescue-ranger-server.onrender.com";
const String DEVICE_ID = "DEVICE_001"; // Unique ID for this device

// Pin Definitions
const int GSM_RX_PIN = D1;  // Connect to GSM TX
const int GSM_TX_PIN = D2;  // Connect to GSM RX
const int GPS_RX_PIN = D3;  // Connect to GPS TX
const int GPS_TX_PIN = D4;  // Connect to GPS RX

// Emergency Contact
const char* EMERGENCY_PHONE = "+919425477596";

// Objects
MAX30105 particleSensor;
TinyGPSPlus gps;
SoftwareSerial gsmSerial(GSM_RX_PIN, GSM_TX_PIN);
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);

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
int32_t bufferLength = 100;
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

    // Initialize sensor communications
    gsmSerial.begin(9600);
    gpsSerial.begin(9600);
    Wire.begin();

    // Initialize MAX30105
    initMAX30105();

    // Initialize GSM
    initGSM();
}

void loop() {
    unsigned long currentMillis = millis();

    if (currentMillis - lastReadingTime >= READ_INTERVAL) {
        lastReadingTime = currentMillis;
        readSensors();
    }

    if (currentMillis - lastServerUpdateTime >= UPDATE_INTERVAL) {
        lastServerUpdateTime = currentMillis;
        sendDataToServer(); // This will send data via GSM
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
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println("MAX30105 not found!");
        while (1) {
            delay(100);
            Serial.println("Check sensor connection...");
        }
    }

    Serial.println("MAX30105 initialized successfully");
    
    particleSensor.setup(60, 4, 2, 200, 411, 4096);
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
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

void readSensors() {
    // Read MAX30105 data
    particleSensor.check();  // Check the sensor
    
    while (particleSensor.available()) {
        redBuffer[bufferLength] = particleSensor.getRed();
        irBuffer[bufferLength] = particleSensor.getIR();
        particleSensor.nextSample();
        
        // Calculate heart rate and SpO2
        maxim_heart_rate_and_oxygen_saturation(
            irBuffer, bufferLength, redBuffer, &spo2, &validSpO2, &heartRate, &validHeartRate
        );
        
        if (validHeartRate && validSpO2) {
            beatAvg = heartRate;
            spO2Value = spo2;
        }
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
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["heartRate"] = beatAvg;
    doc["spO2"] = spO2Value;
    
    if (validLocation) {
        doc["location"]["latitude"] = latitude;
        doc["location"]["longitude"] = longitude;
    }
    
    doc["batteryLevel"] = batteryLevel;

    String jsonString;
    serializeJson(doc, jsonString);

    // Send JSON data via HTTP POST over GSM
    gsmSerial.println("AT+HTTPINIT"); // Initialize HTTP service
    delay(1000);
    
    gsmSerial.println("AT+HTTPPARA=\"CID\",1"); // Set the context ID for GPRS connection
    delay(1000);
    
    gsmSerial.println("AT+HTTPPARA=\"URL\",\"" + String(SERVER_URL) + "\"");
    delay(1000);
    
    gsmSerial.println("AT+HTTPHEADER=\"Content-Type: application/json\"");
    
    gsmSerial.print("AT+HTTPDATA=");
    gsmSerial.print(jsonString.length());
    gsmSerial.print(",10000"); // Timeout in milliseconds
    delay(500);
    
    gsmSerial.println(jsonString); // Send the JSON data
    
   gsmSerial.println("AT+HTTPACTION=1"); // POST request

   delay(5000); // Wait for response from server

   while (gsmSerial.available()) {
      String responseLine = gsmSerial.readStringUntil('\n');
      Serial.println(responseLine); 
   }
}

void checkAndHandleEmergency() {
   bool currentEmergency = (
       beatAvg < 60 || 
       beatAvg > 100 || 
       spO2Value < 95
   );

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
   
   gsmSerial.println("AT+CMGS=\"" + String(EMERGENCY_PHONE) + "\"");
   delay(1000);
   
   String message = "EMERGENCY ALERT!\n";
   message += "Person needs attention!\n";
   message += "Heart Rate: " + String(beatAvg) + " BPM\n";
   message += "SpO2: " + String(spO2Value) + "%\n";
   message += "Location: http://maps.google.com/?q=";
   message += String(latitude,6) + "," + String(longitude,6);
   
   gsmSerial.println(message);
   delay(100);
   
   gsmSerial.write(26); // Ctrl+Z to send SMS
   delay(1000);
   
   Serial.println("Emergency SMS sent");
}

float getBatteryVoltage() {
   return analogRead(A0) * (4.2 / 1023.0); // Mock battery monitoring
}

void updateBatteryLevel() {
   float voltage = getBatteryVoltage();
   batteryLevel = ((voltage - 3.3) / (4.2 - 3.3)) * 100;

   if (batteryLevel > 100) batteryLevel = 100;
   if (batteryLevel < 0) batteryLevel = 0;
}
