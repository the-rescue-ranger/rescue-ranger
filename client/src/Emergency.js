import React, { useEffect, useState } from "react";
import axios from "axios";

const SERVER_URL = "https://rescueranger.pythonanywhere.com/api/readings";

const Emergency = () => {
  const [sosAlert, setSosAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState(null);

  useEffect(() => {
    const checkVitalSigns = (data) => {
      if (!data) return false;
      return (
        data.heart_rate < 60 || data.heart_rate > 100 || data.spo2 < 95
      );
    };

    const fetchEmergencyStatus = async () => {
      try {
        setError(null);
        const response = await axios.get(SERVER_URL);
        
        if (!response.data || response.data.length === 0) {
          throw new Error("No data received from server");
        }

        const latestData = response.data[response.data.length - 1];
        
        const isEmergency = checkVitalSigns(latestData);
        
        setSosAlert(isEmergency);
        
        if (isEmergency) {
          setLocationDetails({
            latitude: latestData.latitude,
            longitude: latestData.longitude,
          });
          setAlertMessage(
            `🚨 Emergency Alert! Heart rate (${latestData.heart_rate} BPM) is abnormal. SpO2 (${latestData.spo2}%) is low. Medical attention may be required!`
          );
        } else {
          setAlertMessage("All vital signs are within normal ranges.");
          setLocationDetails(null);
        }
        
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyStatus();
    
    const intervalId = setInterval(fetchEmergencyStatus, 10000); // Check every 10 seconds
    
    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading Emergency Status...
      </div>
    );
  }

  return (
    <div className={`p-8 ${sosAlert ? "bg-red-50" : "bg-green-50"} rounded-lg`}>
      {error ? (
        <div>Error: {error}</div>
      ) : (
        <>
          <h2 className={`text-xl font-bold ${sosAlert ? "text-red-600" : "text-green-600"}`}>
            Emergency Alert
          </h2>
          <p>{alertMessage}</p>

          {sosAlert && locationDetails && (
            <>
              <p>Emergency services should be contacted.</p>
              <a
                href={`https://www.google.com/maps?q=${locationDetails.latitude},${locationDetails.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Location
              </a>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Emergency;
