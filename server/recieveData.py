from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logging.basicConfig(level=logging.INFO)

# Constants
EMERGENCY_URL = "https://rescueranger.netlify.app/emergency"
STATUS_URL = "https://rescueranger.netlify.app/status"

# Helper function to validate incoming data
def validate_sensor_data(data):
    required_fields = ["deviceId", "heartRate", "spO2", "location", "batteryLevel", "timestamp"]
    location_fields = ["latitude", "longitude"]

    if not all(field in data for field in required_fields):
        return False, "Missing required fields"
    if not all(field in data["location"] for field in location_fields):
        return False, "Missing location fields"
    return True, None


@app.route("/api/readings", methods=["POST"])
def handle_sensor_data():
    try:
        data = request.get_json()

        # Validate data
        is_valid, error_message = validate_sensor_data(data)
        if not is_valid:
            return jsonify({"error": error_message}), 400

        # Extract relevant fields
        device_id = data["deviceId"]
        heart_rate = data["heartRate"]
        spo2 = data["spO2"]
        latitude = data["location"]["latitude"]
        longitude = data["location"]["longitude"]
        battery_level = data["batteryLevel"]
        timestamp = data["timestamp"]

        logging.info(f"Received data from device {device_id}: {data}")

        # Check for emergency conditions
        if heart_rate < 60 or heart_rate > 100 or spo2 < 95:
            try:
                response = requests.post(
                    EMERGENCY_URL,
                    json={
                        "deviceId": device_id,
                        "message": "SOS",
                        "heartRate": heart_rate,
                        "spO2": spo2,
                        "location": {"latitude": latitude, "longitude": longitude},
                    },
                    timeout=10,
                )
                if response.status_code == 200:
                    logging.info("Emergency signal sent successfully")
                else:
                    logging.error(f"Error sending emergency signal: {response.text}")
            except requests.exceptions.RequestException as e:
                logging.error(f"Error connecting to emergency URL: {e}")

        # Forward data to status endpoint
        try:
            response = requests.post(
                STATUS_URL,
                json={
                    "deviceId": device_id,
                    "heartRate": heart_rate,
                    "spO2": spo2,
                    "location": {"latitude": latitude, "longitude": longitude},
                    "batteryLevel": battery_level,
                    "timestamp": timestamp,
                },
                timeout=10,
            )
            if response.status_code == 200:
                return jsonify({"message": "Data received and forwarded successfully"}), 200
            else:
                logging.error(f"Error sending status data: {response.text}")
                return jsonify({"error": f"Error sending data: {response.text}"}), 500
        except requests.exceptions.RequestException as e:
            logging.error(f"Error connecting to status URL: {e}")
            return jsonify({"error": "Failed to send data to status URL"}), 500

    except Exception as e:
        logging.error(f"Unexpected server error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
