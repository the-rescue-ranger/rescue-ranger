import React, { useEffect, useState } from "react";

const Emergency = () => {
  const [heartRate, setHeartRate] = useState(90); // Sample data
  const [pulseRate, setPulseRate] = useState(50); // Sample data
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    if (heartRate > 100 && pulseRate < 60) {
      setTimeout(() => {
        setIsEmergency(true);
      }, 300000); // Declare emergency after 5 minutes
    }
  }, [heartRate, pulseRate]);

  return (
    <div className="p-5 bg-white rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
      <h2 className="text-2xl font-bold mb-5">Emergency Status</h2>
      {isEmergency ? (
        <div className="p-4 bg-red-500 text-white rounded-lg text-center">
          <h3 className="text-xl font-bold">🚨 SOS Declared! 🚨</h3>
          <p className="mt-2">Heart rate is high and pulse rate is low!</p>
        </div>
      ) : (
        <p className="text-gray-600">Monitoring heart rate and pulse...</p>
      )}
    </div>
  );
};

export default Emergency;
