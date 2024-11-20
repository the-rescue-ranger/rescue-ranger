import React, { useEffect, useState } from "react";
import axios from "axios";

const SERVER_URL = "https://rescueranger.pythonanywhere.com";

const Emergency = () => {
  const [sosAlert, setSosAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVitalSigns = (data) => {
      if (!data) return false;
      
      const heartRate = Number(data.heart_rate);
      const spo2 = Number(data.spo2);
      
      return (
        heartRate < 60 || heartRate > 100 || // Normal heart rate range
        spo2 < 95 // Normal SpO2 range
      );
    };

    const fetchEmergencyStatus = async () => {
      try {
        setError(null);
        const response = await axios.get(SERVER_URL);
        
        if (!response.data) {
          throw new Error("No data received from server");
        }

        const isEmergency = checkVitalSigns(response.data);
        setSosAlert(isEmergency);
        setAlertMessage(
          isEmergency
            ? `🚨 Emergency Alert! ${
                Number(response.data.heart_rate) < 60 || Number(response.data.heart_rate) > 100
                  ? `Heart rate (${response.data.heart_rate} BPM) is abnormal. `
                  : ""
              }${
                Number(response.data.spo2) < 95
                  ? `SpO2 (${response.data.spo2}%) is low. `
                  : ""
              }Medical attention may be required!`
            : "All vital signs are within normal ranges."
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchEmergencyStatus, 10000);
    fetchEmergencyStatus(); // Initial fetch
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-5 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold">Emergency Alert</h1>
        <div className="mt-4">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold">Emergency Alert</h1>
      {error ? (
        <div className="mt-4 bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className={`mt-4 ${sosAlert ? 'text-red-600' : 'text-green-600'}`}>
          <p className={`${sosAlert ? 'text-xl' : 'text-lg'} font-semibold`}>
            {alertMessage}
          </p>
          {sosAlert && (
            <div className="mt-4 animate-pulse">
              <div className="w-3 h-3 bg-red-600 rounded-full inline-block mr-2"></div>
              <span className="text-red-600">Emergency services should be contacted</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Emergency;
