from flask import Flask, request, jsonify
import requests
import logging

# Configure logging for better debugging and error handling
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = Flask(__name__)

@app.route('/api/receive_data', methods=['POST'])
def receive_data():
  """Receives data from the Node MCU and forwards it to the Netlify app.

  Returns:
      JSON response: {'message': 'Data received successfully!'} on success,
                     or {'error': 'Error: <reason>'} on failure.
  """

  try:
    # Get data from request body
    data = request.get_json()

    # Validate data (optional)
    # ... (implement data validation logic here, e.g., using a schema)

    # Send data to Netlify app (replace with your actual URL)
    url = "https://rescueranger.netlify.app/status"  # Adjust API endpoint
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
      logging.info("Data sent successfully to Netlify app")
      return jsonify({'message': 'Data received successfully!'}), 200
    else:
      logging.error("Error sending data to Netlify app: %s", response.text)
      return jsonify({'error': 'Error sending data'}), 500

  except Exception as e:
    logging.exception("Error processing data: %s", e)
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=5000)  # Run on all interfaces, port 5000