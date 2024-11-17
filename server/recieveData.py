from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/data", methods=["POST"])
def handle_sensor_data():
    try:
        data = request.get_json()
        heart_rate = data.get("HR")
        spo2 = data.get("SpO2")
        latitude = data.get("Lat")
        longitude = data.get("Lon")

        # Check for emergency conditions
        if heart_rate < 60 or heart_rate > 100 or spo2 < 90:
            emergency_url = "https://rescueranger.netlify.app/emergency"
            response = requests.post(emergency_url, json={"message": "SOS"})
            if response.status_code == 200:
                print("Emergency signal sent successfully")
            else:
                print(f"Error sending emergency signal: {response.text}")

        # Send regular data to rescueranger.netlify.app/status
        status_url = "https://rescueranger.netlify.app/status"
        response = requests.post(status_url, json={
            "heart_rate": heart_rate,
            "spo2": spo2,
            "latitude": latitude,
            "longitude": longitude
        })

        if response.status_code == 200:
            return jsonify({"message": "Data received successfully"}), 200
        else:
            return jsonify({"error": f"Error sending data: {response.text}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
