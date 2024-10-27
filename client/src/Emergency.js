import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Emergency = () => {
  const [sosAlert, setSosAlert] = useState(false);
  const [alertDuration, setAlertDuration] = useState(0);
  
  const heartRate = 105; // Simulated high heart rate
  const pulseRate = 55; // Simulated low pulse rate

  useEffect(() => {
    if (heartRate > 100 && pulseRate < 60) {
      setAlertDuration((prev) => prev + 1);
    } else {
      setAlertDuration(0);
      setSosAlert(false);
    }

    if (alertDuration >= 5) {
      setSosAlert(true);
    }

    const timer = setInterval(() => {
      setAlertDuration((prev) => (prev < 5 ? prev + 1 : prev));
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [alertDuration, heartRate, pulseRate]);

  return (
    <motion.div
      className="p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold">Emergency Alerts</h1>
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
    </motion.div>
  );
};

export default Emergency;
