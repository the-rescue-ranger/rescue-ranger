#include <SoftwareSerial.h>
#include <TinyGPSPlus.h>
#include <MAX30105.h>
#include <HTTPClient.h>

// Define pins for modules
#define GPS_RX 2
#define GPS_TX 3
#define MAX30105_SCL 6
#define MAX30105_SDA 7

// Create instances of modules
TinyGPSPlus gps;
SoftwareSerial gpsSerial(GPS_RX, GPS_TX);
MAX30105 pulseSensor;

// WiFi credentials (replace with your credentials)
const char* ssid = "your_ssid";
const char* password = "your_password";

// Server URL
const char* serverUrl = "http://your_server_ip:5000/data";

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  gpsSerial.begin(9600);

  // Initialize MAX30105
  pulseSensor.begin();
  pulseSensor.setup();

  // Connect to WiFi (if using WiFi)
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Read GPS data
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
    if (gps.location.isValid()) {
      float latitude = gps.location.lat();
      float longitude = gps.location.lng();
    }
  }

  // Read heart rate and SpO2 data
  int hr = pulseSensor.getHeartRate();
  int spo2 = pulseSensor.getSpO2();

  // Format data as JSON string
  String jsonData = "{\"HR\":" + String(hr) + ",\"SpO2\":" + String(spo2) + ",\"Lat\":" + String(latitude) + ",\"Lon\":" + String(longitude) + "}";

  // Send data to server using HTTP POST request
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(jsonData);

  if (httpCode > 0) {
    Serial.printf("HTTP Code: %d\n", httpCode);
  } else {
    Serial.println("HTTP Request failed");
  }

  http.end();

  delay(1000); // Adjust delay as needed
}
