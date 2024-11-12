import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

const GoogleMapWidget = ({ latitude, longitude }) => {
  const src = `https://www.google.com/maps?q=$${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold">Live Location</h3>
      <iframe
        title="Google Maps"
        src={src}
        width="100%"
        height="400"
        allowFullScreen=""
        loading="lazy"
        className="rounded-lg shadow-lg"
      ></iframe>
    </div>
  );
};

const Status = () => {
  const [healthData, setHealthData] = useState([]);
  const [latestLocation, setLatestLocation] = useState({ lat: "", lng: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000"); // Replace with your API endpoint
        const data = await response.json();

        setHealthData(data);

        if (data.length > 0) {
          const latestData = data[data.length - 1];
          setLatestLocation({ lat: latestData.latitude, lng: latestData.longitude });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // Consider using a polling interval or WebSocket connection for real-time updates
    const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  const chartData = {
    labels: healthData.map((d) => d.timestamp),
    datasets: [
      {
        label: "Heart Rate (BPM)",
        data: healthData.map((d) => d.heart_rate),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.1,
      },
      {
        label: "SPo2 (%)",
        data: healthData.map((d) => d.spo2),
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-5">Status Overview</h2>
      <div className="bg-white p-5 rounded-lg shadow-lg mb-8 transition-transform transform hover:scale-105">
        <h3 className="text-lg font-semibold">Health Metrics Over Time</h3>
        <Line data={chartData} options={{ responsive: true }} />
      </div>
      <GoogleMapWidget latitude={latestLocation.lat} longitude={latestLocation.lng} />
    </div>
  );
};

export default Status;
