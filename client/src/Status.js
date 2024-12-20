import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const mockData = [
  { timestamp: Date.now(), heart_rate: 75, spo2: 98, latitude: 22.6581313, longitude: 75.8267194 },
];

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  return date.toLocaleString('en-US', options);
};

const HealthChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="p-4 text-gray-600">No data available</div>;

  const formattedData = data.map(item => ({
    ...item,
    formattedTimestamp: formatTimestamp(item.timestamp),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="formattedTimestamp" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="hr" domain={[50, 120]} label={{ value: 'Heart Rate (BPM)', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="spo2" orientation="right" domain={[90, 100]} label={{ value: 'SpO2 (%)', angle: 90, position: 'insideRight' }} />
        <Tooltip />
        <Legend verticalAlign="top" height={36} />
        <Line yAxisId="hr" type="monotone" dataKey="heart_rate" stroke="#ef4444" name="Heart Rate" strokeWidth={2} dot={false} />
        <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#3b82f6" name="SpO2" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const GoogleMapWidget = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Live Location</h3>
        <span className="text-sm text-gray-500">(22.6600, 75.8282)</span>
      </div>
      <iframe 
        title="Map" 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.804666328122!2d75.74224247404022!3d22.548988833837715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962f789c6a8164f%3A0x2626101ae6dc763b!2sShri%20Sai%20Academy!5e0!3m2!1sen!2sin!4v1732330100223!5m2!1sen!2sin" 
        width="100%" 
        height={400} 
        style={{ border: 0 }} 
        allowFullScreen 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

const Status = () => {
  const [healthData, setHealthData] = useState(mockData);
  const [latestLocation] = useState({ lat: 22.6581313, lng: 75.8267194 });

  useEffect(() => {
    // Simulate data updates every few seconds
    const intervalId = setInterval(() => {
      const lastHeartRate = healthData[healthData.length - 1]?.heart_rate || 75; // Default to last known heart rate
      const newHeartRate = Math.max(60, Math.min(100, lastHeartRate + (Math.random() > 0.5 ? Math.floor(Math.random() * 5) : -Math.floor(Math.random() * 5)))); // Gradual change
      const newSpO2 = Math.floor(Math.random() * (100 - 95 + 1)) + 95; // SpO2 between 95% and 100%

      const newDataPoint = {
        timestamp: Date.now(),
        heart_rate: newHeartRate,
        spo2: newSpO2,
        latitude: latestLocation.lat,
        longitude: latestLocation.lng,
      };

      setHealthData(prevData => [...prevData.slice(-19), newDataPoint]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [latestLocation]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen space-y-8">
      <h2 className="text-3xl font-bold">Status Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold">Current Heart Rate</h3>
          <div className="text-4xl font-bold text-red-500">{healthData[healthData.length - 1]?.heart_rate} BPM</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold">Current SpO2</h3>
          <div className="text-4xl font-bold text-blue-500">{healthData[healthData.length - 1]?.spo2}%</div>
        </div>
      </div>

      {/* Health Metrics Over Time */}
      <HealthChart data={healthData} />

      {latestLocation && (
        <GoogleMapWidget latitude={latestLocation.lat} longitude={latestLocation.lng} />
      )}
    </div>
  );
};

export default Status;
