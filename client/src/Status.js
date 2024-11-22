import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SERVER_URL = "https://www.pythonanywhere.com/user/RescueRanger/files/home/RescueRanger/Resku/__pycache__/resku.cpython-310.pyc";

const fetchSensorData = async () => {
  try {
    const response = await axios.get(SERVER_URL);
    if (!response.data || response.data.length === 0) {
      throw new Error("No data received from server");
    }
    
    const latestData = response.data[response.data.length - 1];
    return {
      timestamp: new Date(latestData.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      heart_rate: Number(latestData.heart_rate),
      spo2: Number(latestData.spo2),
      latitude: Number(latestData.latitude),
      longitude: Number(latestData.longitude),
    };
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    throw error;
  }
};

const HealthChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="p-4 text-gray-600">No data available</div>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
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

const GoogleMapWidget = ({ latitude, longitude }) => {
  if (!latitude || !longitude) return null;

  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345094326!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!5e0!3m2!1sen!2sau!4v1632823956034!5m2!1sen!2sau`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Live Location</h3>
        <span className="text-sm text-gray-500">({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
      </div>
      <iframe title="Live GPS Location Map" src={mapUrl} width="100%" height={400} frameBorder="0" style={{ border: 0 }} allowFullScreen loading="lazy"/>
    </div>
  );
};

const Status = () => {
  const [healthData, setHealthData] = useState([]);
  const [latestLocation, setLatestLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateData = async () => {
      try {
        setError(null);
        const newDataPoint = await fetchSensorData();
        setHealthData(prevData => [...prevData.slice(-19), newDataPoint]);
        setLatestLocation({ lat: newDataPoint.latitude, lng: newDataPoint.longitude });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    updateData();
    const intervalId = setInterval(updateData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 rounded-lg">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-2 text-red-500">{error}</p>
      </div>
    );
  }

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
