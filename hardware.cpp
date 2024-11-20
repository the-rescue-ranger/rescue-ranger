#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <TinyGPS++.h>
#include <SoftwareSerial.h>

// Define pins for GSM module
#define MODEM_TX 27  // TX pin of GSM (connect to RX of GSM)
#define MODEM_RX 26  // RX pin of GSM (connect to TX of GSM)

// Define pins for GPS
static const int RXPin = 4, TXPin = 3; // GPS Serial pins
static const uint32_t GPSBaud = 9600;  // GPS Baud rate
TinyGPSPlus gps;
SoftwareSerial ss(RXPin, TXPin); // Software serial for GPS

// MAX30102 settings
MAX30105 particleSensor;

const byte RATE_SIZE = 4; // Increase this for more averaging. 4 is good.
byte rates[RATE_SIZE];     // Array of heart rates
byte rateSpot = 0;
long lastBeat = 0;         // Time at which the last beat occurred

float beatsPerMinute;
int beatAvg;

// Function to send an SMS using AT commands
void sendSMS(String message, String phoneNumber) {
    Serial1.println("AT+CMGF=1"); // Set SMS mode to text
    delay(100);
    Serial1.print("AT+CMGS=\"");
    Serial1.print(phoneNumber);
    Serial1.println("\"");
    delay(100);
    Serial1.println(message); // Message content 
    delay(100);
    Serial1.write(26); // Send Ctrl+Z to indicate end of message
}

void setup() {
    Serial.begin(115200);     // Initialize serial monitor
    Serial1.begin(9600);      // Initialize serial for GSM module
    ss.begin(GPSBaud);        // Initialize serial for GPS

    // Initialize MAX30102 sensor
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println("MAX30102 was not found. Please check wiring/power.");
        while (1); // Halt if sensor not found
    }
    
    particleSensor.setup(); // Configure sensor with default settings
    particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate sensor is running
    particleSensor.setPulseAmplitudeGreen(0);   // Turn off Green LED

    Serial.println("Place your index finger on the sensor with steady pressure.");
}

void loop() {
    long irValue = particleSensor.getIR();

    if (checkForBeat(irValue) == true) {
        long delta = millis() - lastBeat;
        lastBeat = millis();
        beatsPerMinute = 60 / (delta / 1000.0);

        if (beatsPerMinute < 255 && beatsPerMinute > 20) {
            rates[rateSpot++] = (byte)beatsPerMinute; // Store this reading in the array
            rateSpot %= RATE_SIZE;                     // Wrap variable

            // Take average of readings
            beatAvg = 0;
            for (byte x = 0; x < RATE_SIZE; x++)
                beatAvg += rates[x];
            beatAvg /= RATE_SIZE;
        }
    }

    Serial.print("IR=");
    Serial.print(irValue);
    Serial.print(", BPM=");
    Serial.print(beatsPerMinute);
    Serial.print(", Avg BPM=");
    Serial.print(beatAvg);

    if (irValue < 50000)
        Serial.print(" No finger?");

    Serial.println();

    // Read GPS data
    while (ss.available() > 0) {
        gps.encode(ss.read());
        if (gps.location.isUpdated()) {
            float latitude = gps.location.lat();
            float longitude = gps.location.lng();

            String smsMessage = "Lat: " + String(latitude) + ", Lng: " + String(longitude) +
                                ", HR: " + String(beatsPerMinute) + ", Avg HR: " + String(beatAvg);
            
            sendSMS(smsMessage, "+919425477596"); // Replace with your phone number

            delay(10000); // Delay before sending next SMS (10 seconds)
        }
    }

    delay(100); // Small delay to avoid overwhelming the loop
}
