import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fetchSensorData = async () => {
  try {
    const response = await fetch("https://rescue-ranger-server.onrender.com");
    if (!response.ok) {
      throw new Error("Failed to fetch data from server");
    }
    const data = await response.json();
    return {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      heart_rate: data.heart_rate,
      spo2: data.spo2,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    return null;
  }
};

const HealthChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} interval="preserveEnd" />
          <YAxis yAxisId="hr" domain={[60, 100]} label={{ value: 'Heart Rate (BPM)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="spo2" orientation="right" domain={[90, 100]} label={{ value: 'SpO2 (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }} labelStyle={{ fontWeight: 'bold' }} />
          <Legend verticalAlign="top" height={36} />
          <Line yAxisId="hr" type="monotone" dataKey="heart_rate" stroke="#ef4444" name="Heart Rate" strokeWidth={2} dot={false} animationDuration={300} />
          <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#3b82f6" name="SpO2" strokeWidth={2} dot={false} animationDuration={300} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const GoogleMapWidget = ({ latitude, longitude }) => {
  if (!latitude || !longitude) return null;

  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345094326!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sau!4v1632823956034!5m2!1sen!2sau`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Live Location
          <span className="text-sm font-normal text-gray-500">
            ({latitude.toFixed(4)}, {longitude.toFixed(4)})
          </span>
        </h3>
      </div>
      <div className="p-0 overflow-hidden rounded-b-lg">
        <iframe
          title="Live GPS Location Map"
          src={mapUrl}
          width="100%"
          height="400"
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

const Status = () => {
  const [healthData, setHealthData] = useState([]);
  const [latestLocation, setLatestLocation] = useState({ lat: 37.7749, lng: -122.4194 });

  useEffect(() => {
    const updateData = async () => {
      const newDataPoint = await fetchSensorData();
      if (newDataPoint) {
        setHealthData((prevData) => [...prevData.slice(-19), newDataPoint]);
        setLatestLocation({ lat: newDataPoint.latitude, lng: newDataPoint.longitude });
      }
    };

    // Initial fetch
    updateData();
    
    const intervalId = setInterval(updateData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const getLatestMetric = (metric) => {
    if (healthData.length === 0) return null;
    return healthData[healthData.length - 1][metric];
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen space-y-8">
      <h2 className="text-3xl font-bold">Status Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Current Heart Rate</h3>
          </div>
          <div className="p-4">
            <div className="text-4xl font-bold text-red-500">
              {getLatestMetric('heart_rate')} BPM
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Current SpO2</h3>
          </div>
          <div className="p-4">
            <div className="text-4xl font-bold text-blue-500">
              {getLatestMetric('spo2')}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Health Metrics Over Time</h3>
        </div>
        <div className="p-4">
          <HealthChart data={healthData} />
        </div>
      </div>

      <GoogleMapWidget 
        latitude={latestLocation.lat} 
        longitude={latestLocation.lng} 
      />
    </div>
  );
};

export default Status;
