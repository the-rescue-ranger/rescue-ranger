from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logging.basicConfig(level=logging.INFO)

# Use environment variables for URLs
EMERGENCY_URL = os.getenv("EMERGENCY_URL", "https://rescueranger.netlify.app/emergency")
STATUS_URL = os.getenv("STATUS_URL", "https://rescueranger.netlify.app/status")

@app.route("/data", methods=["POST"])
def handle_sensor_data():
    try:
        data = request.get_json()

        # Validate required fields
        if not all(k in data for k in ("HR", "SpO2", "Lat", "Lon")):
            return jsonify({"error": "Missing required data fields"}), 400

        heart_rate = data["HR"]
        spo2 = data["SpO2"]
        latitude = data["Lat"]
        longitude = data["Lon"]

        # Check for emergency conditions
        if heart_rate < 60 or heart_rate > 100 or spo2 < 90:
            try:
                response = requests.post(EMERGENCY_URL, json={"message": "SOS"}, timeout=10)
                if response.status_code == 200:
                    logging.info("Emergency signal sent successfully")
                else:
                    logging.error(f"Error sending emergency signal: {response.text}")
            except requests.exceptions.RequestException as e:
                logging.error(f"Error connecting to emergency URL: {e}")

        # Send regular data to status endpoint
        try:
            response = requests.post(STATUS_URL, json={
                "heart_rate": heart_rate,
                "spo2": spo2,
                "latitude": latitude,
                "longitude": longitude
            }, timeout=10)

            if response.status_code == 200:
                return jsonify({"message": "Data received successfully"}), 200
            else:
                return jsonify({"error": f"Error sending data: {response.text}"}), 500
        except requests.exceptions.RequestException as e:
            logging.error(f"Error connecting to status URL: {e}")
            return jsonify({"error": "Failed to send data to status URL"}), 500

    except Exception as e:
        logging.error(f"Unexpected server error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
