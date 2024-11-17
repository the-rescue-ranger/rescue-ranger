import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Generate more stable mock data
const generateMockData = (count = 20) => {
  const baseTime = new Date();
  return Array.from({ length: count }, (_, i) => {
    const time = new Date(baseTime - (count - 1 - i) * 5000);
    return {
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      heart_rate: Math.floor(75 + Math.sin(i * 0.5) * 10),
      spo2: Math.floor(96 + Math.sin(i * 0.3) * 2),
      latitude: 37.7749 + (Math.sin(i * 0.1) * 0.001),
      longitude: -122.4194 + (Math.cos(i * 0.1) * 0.001)
    };
  });
};

const HealthChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            interval="preserveEnd"
          />
          <YAxis
            yAxisId="hr"
            domain={[60, 100]}
            label={{ value: 'Heart Rate (BPM)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="spo2"
            orientation="right"
            domain={[90, 100]}
            label={{ value: 'SpO2 (%)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            yAxisId="hr"
            type="monotone"
            dataKey="heart_rate"
            stroke="#ef4444"
            name="Heart Rate"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
          <Line
            yAxisId="spo2"
            type="monotone"
            dataKey="spo2"
            stroke="#3b82f6"
            name="SpO2"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const GoogleMapWidget = ({ latitude, longitude }) => {
  if (!latitude || !longitude) return null;
  
  // Use the correct Google Maps URL format
  const mapUrl = `https://www.google.com/maps/@${latitude},${longitude},15z?entry=ttu`;
  
  return (
    <Card className="transition-transform hover:scale-[1.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Live Location
          <span className="text-sm font-normal text-gray-500">
            ({latitude.toFixed(4)}, {longitude.toFixed(4)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg">
        <iframe
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
      </CardContent>
    </Card>
  );
};

const Status = () => {
  const [healthData, setHealthData] = useState([]);
  const [latestLocation, setLatestLocation] = useState({ lat: 37.7749, lng: -122.4194 });

  useEffect(() => {
    // Initialize with mock data
    setHealthData(generateMockData());

    // Update data every 5 seconds
    const updateData = () => {
      setHealthData(prevData => {
        const newDataPoint = {
          timestamp: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }),
          heart_rate: Math.floor(75 + Math.sin(prevData.length * 0.5) * 10),
          spo2: Math.floor(96 + Math.sin(prevData.length * 0.3) * 2),
          latitude: 37.7749 + (Math.sin(prevData.length * 0.1) * 0.001),
          longitude: -122.4194 + (Math.cos(prevData.length * 0.1) * 0.001)
        };

        setLatestLocation({
          lat: newDataPoint.latitude,
          lng: newDataPoint.longitude
        });

        // Keep last 20 data points
        return [...prevData.slice(1), newDataPoint];
      });
    };

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
        <Card className="transition-transform hover:scale-[1.02]">
          <CardHeader>
            <CardTitle>Current Heart Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">
              {getLatestMetric('heart_rate')} BPM
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-transform hover:scale-[1.02]">
          <CardHeader>
            <CardTitle>Current SpO2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-500">
              {getLatestMetric('spo2')}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="transition-transform hover:scale-[1.02]">
        <CardHeader>
          <CardTitle>Health Metrics Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthChart data={healthData} />
        </CardContent>
      </Card>

      <GoogleMapWidget 
        latitude={latestLocation.lat} 
        longitude={latestLocation.lng} 
      />
    </div>
  );
};

export default Status;
