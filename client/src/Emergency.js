import React, { useEffect, useState } from "react";

const Emergency = () => {
  const [sosAlert, setSosAlert] = useState(false);
  const [alertDuration, setAlertDuration] = useState(0); // Duration of abnormal readings

  // Example simulated heart rate and pulse rate values
  const heartRate = 105;
  const pulseRate = 55;

  useEffect(() => {
    const interval = setInterval(() => {
      if (heartRate > 100 && pulseRate < 60) {
        setAlertDuration((prev) => prev + 1);
        if (alertDuration >= 5) { // 5 minutes of abnormal readings
          setSosAlert(true);
        }
      } else {
        setAlertDuration(0); // Reset if conditions are normal
        setSosAlert(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [alertDuration]);

  return (
    <div className="p-5 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold">Emergency Alert</h1>
      {sosAlert ? (
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
