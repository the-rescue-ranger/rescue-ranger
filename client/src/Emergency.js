import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Emergency = () => {
  const [sosAlert, setSosAlert] = useState(false);
  const [alertDuration, setAlertDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Replace with your actual API endpoint
  const apiUrl = 'http://your-api-endpoint/data';

  useEffect(() => {
    const fetchAndCheckData = async () => {
      try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        const heartRate = data.HR;
        const pulseRate = data.SpO2;

        if (heartRate > 100 && pulseRate < 60) {
          setAlertDuration((prev) => prev + 1);
          if (alertDuration >= 5) { // 5 minutes of abnormal readings
            setSosAlert(true);
          }
        } else {
          setAlertDuration(0);
          setSosAlert(false);
        }
      } catch (error) {
        setErrorMessage('Error fetching data: ' + error.message);
      }
    };

    const interval = setInterval(fetchAndCheckData, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [alertDuration]);

  return (
    <div className="p-5 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold">Emergency Alert</h1>
      {errorMessage ? (
        <div className="mt-4 text-red-600">
          <p>{errorMessage}</p>
        </div>
      ) : sosAlert ? (
        <div className="mt-4 text-red-600">
          <p className="text-xl">🚨 SOS Alert! 🚨</p>
          <p>Your heart rate is high and pulse rate is low!</p>
        </div>
      ) : (
        <div className="mt-4 text-green-600">
          <p>All readings are normal.</p>
        </div>
      )}
    </div>
  );
};

export default Emergency;
