import React, { useEffect, useState } from "react";

const mockEmergencyData = {
  heart_rate: Math.floor(Math.random() * (120 - 50 + 1)) + 50,
  spo2: Math.floor(Math.random() * (100 - 90 + 1)) + 90,
};

const Emergency = () => {
  const [sosAlert, setSosAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  const checkVitalSigns = (data) => {
    return (
      data.heart_rate < 60 || data.heart_rate > 140 || data.spo2 < 
    );
  };

  useEffect(() => {
    const isEmergency = checkVitalSigns(mockEmergencyData);
    
    setSosAlert(isEmergency);
    
    if (isEmergency) {
      setAlertMessage(
        `🚨 Emergency Alert! Heart rate (${mockEmergencyData.heart_rate} BPM) is abnormal. SpO2 (${mockEmergencyData.spo2}%) is low. Medical attention may be required!`
      );
    } else {
      setAlertMessage("All vital signs are within normal ranges.");
    }
    
    // Simulate updates every few seconds
    const intervalId = setInterval(() => {
      // Update mock emergency data here if needed
    }, 10000); 

    return () => clearInterval(intervalId); 
  }, []);

  return (
    <div className={`p-8 ${sosAlert ? "bg-red-50" : "bg-green-50"} rounded-lg`}>
      <h2 className={`text-xl font-bold ${sosAlert ? "text-red-600" : "text-green-600"}`}>
        Emergency Alert
      </h2>
      <p>{alertMessage}</p>

      {sosAlert && (
        <>
          <p>Emergency services should be contacted.</p>
          {/* Fixed location link */}
          <a
            href={`https://www.google.com/maps/place/Shiv+Sagar+Colony/@22.6581313,75.8267194`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Location
          </a>
        </>
      )}
    </div>
  );
};

export default Emergency;
