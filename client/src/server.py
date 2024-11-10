from flask import Flask, request, jsonify
from datetime import datetime
import json

app = Flask(__name__)
data_storage = []

@app.route('/api/data', methods=['GET'])
def receive_data():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    heart_rate = request.args.get('heartRate')
    spo2 = request.args.get('spO2')
    timestamp = datetime.now().strftime("%H:%M")

    if heart_rate and spo2:
        data_point = {
            "timestamp": timestamp,
            "heart_rate": float(heart_rate),
            "spo2": float(spo2),
            "latitude": lat,
            "longitude": lng
        }
        data_storage.append(data_point)

    return jsonify({"status": "success", "data": data_point}), 200

@app.route('/api/health_data', methods=['GET'])
def send_health_data():
    return jsonify(data_storage), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
