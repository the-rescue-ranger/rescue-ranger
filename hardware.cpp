#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>
#include <Wire.h>
#include <TinyGPS++.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <spo2_algorithm.h>

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_URL = "https://rescue-ranger-server.onrender.com";
const String DEVICE_ID = "DEVICE_001"; // Unique ID for this device

// Pin Definitions
const int GSM_RX_PIN = D1;  // Connect to GSM TX
const int GSM_TX_PIN = D2;  // Connect to GSM RX
const int GPS_RX_PIN = D3;  // Connect to GPS TX
const int GPS_TX_PIN = D4;  // Connect to GPS RX

// Emergency Contact
const char* EMERGENCY_PHONE = "+1234567890";

// Objects
MAX30105 particleSensor;
TinyGPSPlus gps;
SoftwareSerial gsmSerial(GSM_RX_PIN, GSM_TX_PIN);
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);
WiFiClient wifiClient;
HTTPClient http;

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
  // Initialize Serial for debugging
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

  // Connect to WiFi
  initWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  // Read sensors at regular intervals
  if (currentMillis - lastReadingTime >= READ_INTERVAL) {
    lastReadingTime = currentMillis;
    readSensors();
  }

  // Send data to server at regular intervals
  if (currentMillis - lastServerUpdateTime >= UPDATE_INTERVAL) {
    lastServerUpdateTime = currentMillis;
    sendDataToServer();
  }

  // Process GPS data
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      updateGPSData();
    }
  }

  // Check for emergency conditions and handle them
  checkAndHandleEmergency();

  // Allow ESP8266 to handle background tasks
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
  
  gsmSerial.println("AT+CMGF=1");  // Set SMS text mode
  delay(1000);
  
  gsmSerial.println("AT+CNMI=1,2,0,0,0");  // Configure SMS notifications
  delay(1000);
  
  Serial.println("GSM initialized");
}

void initWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.println("IP address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
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
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Attempting reconnection...");
    WiFi.reconnect();
    return;
  }

  // Create JSON document
  StaticJsonDocument<200> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["heartRate"] = beatAvg;
  doc["spO2"] = spO2Value;
  doc["location"]["latitude"] = latitude;
  doc["location"]["longitude"] = longitude;
  doc["batteryLevel"] = batteryLevel;
  doc["timestamp"] = millis();

  // Serialize JSON
  String jsonString;
  serializeJson(doc, jsonString);

  // Send to server
  http.begin(wifiClient, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error on sending POST: " + String(httpResponseCode));
  }
  
  http.end();
}

void checkAndHandleEmergency() {
  bool currentEmergency = (
    beatAvg < 60 || 
    beatAvg > 100 || 
    spO2Value < 95
  );

  // If new emergency condition detected
  if (currentEmergency && !isEmergency) {
    isEmergency = true;
    sendEmergencySMS();
  }

  // Reset emergency status if conditions return to normal
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
  message += String(latitude, 6) + "," + String(longitude, 6);
  
  gsmSerial.println(message);
  delay(100);
  
  gsmSerial.write(26);  // Ctrl+Z to send SMS
  delay(1000);
  
  Serial.println("Emergency SMS sent");
}

float getBatteryVoltage() {
  // Mock battery monitoring
  return analogRead(A0) * (4.2 / 1023.0);
}

void updateBatteryLevel() {
  // Mock battery level calculation
  float voltage = getBatteryVoltage();
  batteryLevel = ((voltage - 3.3) / (4.2 - 3.3)) * 100;
  if (batteryLevel > 100) batteryLevel = 100;
  if (batteryLevel < 0) batteryLevel = 0;
}
