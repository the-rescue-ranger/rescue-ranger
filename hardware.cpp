#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <SIM800L.h>
#include <MAX30105.h>
#include <HTTPClient.h>

// Define pins for modules
#define GPS_RX 2
#define GPS_TX 3
#define GSM_RX 4
#define GSM_TX 5

// Create instances of modules
TinyGPSPlus gps;
SoftwareSerial gpsSerial(GPS_RX, GPS_TX);
SIM800L sim800l(&Serial1);
MAX30105 pulseSensor;

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  gpsSerial.begin(9600);
  Serial1.begin(9600);

  // Initialize MAX30105
  pulseSensor.begin();
  pulseSensor.setup();

  // Initialize GSM module
  sim800l.init();

  // Attach to network and set APN (replace with your Airtel APN if different)
  sim800l.attachNetwork();
  sim800l.setAPN("internet");
}

void loop() {
  // Read GPS data
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
    if (gps.location.isValid()) {
      // Get latitude, longitude, and time
      float latitude = gps.location.lat();
      float longitude = gps.location.lng();
      String time = gps.time.hour() + ":" + gps.time.minute() + ":" + gps.time.second();
    }
  }

  // Read heart rate and SpO2 data
  int hr = pulseSensor.getHeartRate();
  int spo2 = pulseSensor.getSpO2();

  // Format data as JSON string
  String jsonData = "{\"HR\":" + String(hr) + ",\"SpO2\":" + String(spo2) + ",\"Lat\":" + String(latitude) + ",\"Lon\":" + String(longitude) + ",\"Time\":\"" + time + "\"}";

  // Send data to server using HTTP POST request
  HTTPClient http;
  http.begin("http://127.0.0.1:5000");  // Replace with your server address
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(jsonData);

  if (httpCode > 0) {
    Serial.printf("HTTP Code: %d\n", httpCode);
  } else {
    Serial.println("HTTP Request failed");
  }

  http.end();

  // Delay before next reading
  delay(1000); // Adjust delay as needed
}