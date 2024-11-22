#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// Define Serial for GSM
#define SerialMon Serial
#define SerialAT  Serial1 // Use Serial1 for communication with GSM module

// Your modem's serial pins
#define SIM800L_RX 10  // RX pin of SIM800L connected to pin 10
#define SIM800L_TX 11  // TX pin of SIM800L connected to pin 11

// GPS Module connection - Using ESP32's Hardware Serial 2
#define GPS_SERIAL_RX 16  // GPS TX connects to ESP32 RX2 (GPIO 16)
#define GPS_SERIAL_TX 17  // GPS RX connects to ESP32 TX2 (GPIO 17)

// Create objects
TinyGPSPlus gps;
HardwareSerial GPSSerial(2); // Use hardware serial for GPS

void setup() {
    // Start Serial Monitor (commented out)
    // SerialMon.begin(115200);
    
    // Start GPS serial
    GPSSerial.begin(9600); // Set this to your GPS module's baud rate
    
    // Initialize GSM serial
    SerialAT.begin(9600); // Set this to your GSM module's baud rate
    
    // Test GSM connection
    testGSMConnection();
    
    // Set APN for GPRS connection
    setAPN("internet");
}

void loop() {
    while (GPSSerial.available()) {
        gps.encode(GPSSerial.read());
        if (gps.location.isUpdated()) {
            float latitude = gps.location.lat();
            float longitude = gps.location.lng();
            
            // Removed Serial Monitor output
            // SerialMon.print("Latitude: ");
            // SerialMon.print(latitude, 6);
            // SerialMon.print(" Longitude: ");
            // SerialMon.println(longitude, 6);
            
            sendSMS("+919425477596", "Hello from Rescue Ranger001!"); // Replace with your number
            sendDataToServer(latitude, longitude);
        }
    }
}

void testGSMConnection() {
    SerialAT.println("AT"); // Send AT command
    delay(1000); // Wait for response
    
    if (SerialAT.available()) {
        String response = SerialAT.readString();
        // Removed response printout
        // SerialMon.println(response); 
        
        if (response.indexOf("OK") != -1) {
            // Removed success message printout
            // SerialMon.println("GSM Module is ready.");
        } else {
            // Removed failure message printout
            // SerialMon.println("Failed to connect to GSM Module.");
        }
    }
}

void setAPN(const char* apn) {
    SerialAT.print("AT+CSTT=\"");
    SerialAT.print(apn);
    SerialAT.println("\",\"\",\"\""); // The second and third parameters are username and password, left empty here.
    delay(1000); 

    SerialAT.println("AT+CIICR"); // Bring up wireless connection
    delay(2000); 

    SerialAT.println("AT+CIFSR"); // Get local IP address
    delay(1000);
}

void sendSMS(const char* number, const char* message) {
    SerialAT.print("AT+CMGF=1\r"); // Set SMS mode to text
    delay(1000);
    
    SerialAT.print("AT+CMGS=\"");
    SerialAT.print(number);
    SerialAT.print("\"\r"); // Recipient's phone number
    delay(1000);
    
    SerialAT.print(message); // Message content
    delay(1000);
    
    SerialAT.write(26); // Send Ctrl+Z to indicate end of message
    delay(1000);
    
    String response = "";
    while (SerialAT.available()) {
        response += char(SerialAT.read());
    }
    
    // Removed SMS response printout
    // SerialMon.println("SMS Response: " + response); 
}

void sendDataToServer(float latitude, float longitude) {
    String jsonString;
    
    StaticJsonDocument<200> doc;
    doc["latitude"] = latitude;
    doc["longitude"] = longitude;

    serializeJson(doc, jsonString);
    
	// Prepare HTTP request using AT commands.
	SerialAT.println("AT+HTTPINIT");
	delay(1000);
	SerialAT.println("AT+HTTPPARA=\"CID\",1");
	delay(1000);
	SerialAT.print("AT+HTTPPARA=\"URL\",\"https://www.pythonanywhere.com/user/RescueRanger/files/home/RescueRanger/Resku/resku.py\"\r"); 
	delay(1000);
	SerialAT.print("AT+HTTPHEADER=\"Content-Type: application/json\"\r");
	delay(1000);
	SerialAT.print("AT+HTTPDATA=" + String(jsonString.length()) + ",10000\r"); 
	delay(1000);
	SerialAT.print(jsonString); 
	delay(1000);
	SerialAT.println("AT+HTTPACTION=1");   // POST request
	delay(5000); // Wait for the response

	String response = "";
	while (SerialAT.available()) {
        response += char(SerialAT.read());
	}
	
	// Removed HTTP response printout
	// SerialMon.println("HTTP Response: " + response); 
}
