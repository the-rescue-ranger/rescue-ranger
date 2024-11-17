import React, { useEffect, useState } from "react";
import axios from "axios";

const Emergency = () => {
  const [sosAlert, setSosAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Replace with your actual API endpoint to fetch emergency alerts
  const apiUrl = "https://rescue-ranger-server.onrender.com";

  useEffect(() => {
    const fetchEmergencyAlert = async () => {
      try {
        const response = await axios.get(apiUrl);

        if (response.data && response.data.message === "SOS") {
          setSosAlert(true);
          setAlertMessage("🚨 SOS Alert! Heart rate or SpO2 levels indicate an emergency!");
        } else {
          setSosAlert(false);
          setAlertMessage("All readings are normal.");
        }
      } catch (error) {
        setErrorMessage("Error fetching emergency alert: " + error.message);
      }
    };

    // Fetch the emergency alert every 10 seconds
    const interval = setInterval(fetchEmergencyAlert, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-5 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold">Emergency Alert</h1>

      {errorMessage ? (
        <div className="mt-4 text-red-600">
          <p>{errorMessage}</p>
        </div>
      ) : sosAlert ? (
        <div className="mt-4 text-red-600">
          <p className="text-xl font-semibold">{alertMessage}</p>
        </div>
      ) : (
        <div className="mt-4 text-green-600">
          <p className="text-lg">{alertMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Emergency;
