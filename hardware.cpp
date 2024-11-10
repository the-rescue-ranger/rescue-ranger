#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include "Adafruit_MAX30105.h"
#include <SoftwareSerial.h>

Adafruit_MAX30105 max30105;
SoftwareSerial gpsSerial(D5, D6); // RX, TX for GPS
SoftwareSerial simSerial(D7, D8); // RX, TX for SIM800L

const char* ssid = "your_SSID";
const char* password = "your_PASSWORD";
String serverURL = "https://rescueranger.netlify.app/api/data";

void setup() {
  Serial.begin(9600);
  gpsSerial.begin(9600);
  simSerial.begin(9600);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  if (!max30105.begin()) {
    Serial.println("MAX30105 not found. Check wiring.");
    while (1);
  }
  max30105.setup();
}

void loop() {
  String latitude, longitude;
  float heartRate, spO2;

  if (getGPSData(latitude, longitude) && getSensorData(heartRate, spO2)) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String url = serverURL + "?lat=" + latitude + "&lng=" + longitude + "&heartRate=" + String(heartRate) + "&spO2=" + String(spO2);

      http.begin(url);
      int httpCode = http.GET();
      if (httpCode > 0) {
        Serial.println("Data sent successfully.");
      } else {
        Serial.println("Error sending data.");
      }
      http.end();
    }
  }
  delay(10000); // Send data every 10 seconds
}

bool getGPSData(String &lat, String &lng) {
  if (gpsSerial.available()) {
    String gpsData = gpsSerial.readStringUntil('\n');
    // Parse latitude and longitude from GPS data
    lat = "parsed_latitude"; // Placeholder for parsed latitude
    lng = "parsed_longitude"; // Placeholder for parsed longitude
    return true;
  }
  return false;
}

bool getSensorData(float &heartRate, float &spO2) {
  uint32_t irValue = max30105.getIR();
  if (irValue > 50000) { // Detect if finger is on sensor
    heartRate = max30105.getHeartRate();
    spO2 = max30105.getSpO2();
    return true;
  }
  return false;
}
