#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server endpoint
const char* serverUrl = "https://www.pythonanywhere.com/user/RescueRanger/files/home/RescueRanger/Resku/resku.py";

// GPS Module connection - Using ESP32's Hardware Serial 2
#define GPS_SERIAL_RX 16  // GPS TX connects to ESP32 RX2 (GPIO 16)
#define GPS_SERIAL_TX 17  // GPS RX connects to ESP32 TX2 (GPIO 17)

// Create objects
TinyGPSPlus gps;
HardwareSerial GPSSerial(2); // Use hardware serial 2

// Device identifier
const char* deviceId = "GPS_001";

// Battery monitoring
const int batteryPin = 35;  // ADC pin for battery monitoring

// Function declarations
void connectWiFi();
float getBatteryPercentage();
void sendDataToServer(float latitude, float longitude, float battery);

void setup() {
    // Start Serial Monitor
    Serial.begin(115200);
    
    // Start GPS serial
    GPSSerial.begin(9600, SERIAL_8N1, GPS_SERIAL_RX, GPS_SERIAL_TX);
    
    // Configure ADC for battery monitoring
    analogReadResolution(12);  // Set ADC resolution to 12 bits
    analogSetAttenuation(ADC_11db);  // Set ADC attenuation
    
    // Connect to WiFi
    connectWiFi();
    
    Serial.println("System initialized and ready!");
}

void loop() {
    static unsigned long lastSendTime = 0;
    const unsigned long sendInterval = 5000;  // Send data every 5 seconds
    
    // Read GPS data
    while (GPSSerial.available() > 0) {
        gps.encode(GPSSerial.read());
    }
    
    // Check if it's time to send data and if we have valid GPS data
    if (millis() - lastSendTime >= sendInterval && gps.location.isValid()) {
        float latitude = gps.location.lat();
        float longitude = gps.location.lng();
        float battery = getBatteryPercentage();
        
        // Print values to Serial Monitor
        Serial.println("Current readings:");
        Serial.print("Latitude: "); Serial.println(latitude, 6);
        Serial.print("Longitude: "); Serial.println(longitude, 6);
        Serial.print("Battery: "); Serial.print(battery); Serial.println("%");
        
        // Send data to server
        sendDataToServer(latitude, longitude, battery);
        
        lastSendTime = millis();
    }
    
    // Check WiFi connection and reconnect if needed
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi connection lost. Reconnecting...");
        connectWiFi();
    }
    
    // Small delay to prevent overwhelming the GPS module
    delay(10);
}

void connectWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nWiFi connection failed!");
    }
}

float getBatteryPercentage() {
    // Read battery voltage through voltage divider
    // Assuming 3.3V reference voltage and voltage divider ratio
    // Adjust these values based on your hardware setup
    const float maxVoltage = 4.2;  // Max battery voltage
    const float minVoltage = 3.3;  // Min battery voltage
    
    int rawValue = analogRead(batteryPin);
    float voltage = (rawValue / 4095.0) * 3.3 * 2; // Adjust multiplier based on voltage divider
    
    // Convert to percentage
    float percentage = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
    percentage = constrain(percentage, 0, 100);
    
    return percentage;
}

void sendDataToServer(float latitude, float longitude, float battery) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        
        // Create JSON document
        StaticJsonDocument<200> doc;
        doc["deviceId"] = deviceId;
        
        JsonObject location = doc.createNestedObject("location");
        location["latitude"] = latitude;
        location["longitude"] = longitude;
        
        doc["batteryLevel"] = (int)battery;
        doc["timestamp"] = String(millis());
        
        // Serialize JSON to string
        String jsonString;
        serializeJson(doc, jsonString);
        
        // Configure HTTP request
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        // Send POST request
        int httpResponseCode = http.POST(jsonString);
        
        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("HTTP Response code: " + String(httpResponseCode));
            Serial.println("Response: " + response);
        } else {
            Serial.println("Error on sending POST: " + String(httpResponseCode));
        }
        
        http.end();
    } else {
        Serial.println("Error: WiFi not connected");
    }
}
