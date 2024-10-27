import React from "react";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Status = () => {
  const data = {
    labels: ["10:00", "10:05", "10:10", "10:15", "10:20"],
    datasets: [
      {
        label: "Heart Rate (BPM)",
        data: [70, 75, 72, 78, 74],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
      {
        label: "SPo2 (%)",
        data: [95, 94, 96, 97, 95],
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };

  return (
    <motion.div
      className="p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-5">Health Metrics</h2>
      <div className="bg-white p-5 rounded-lg shadow-lg mb-8">
        <h3 className="text-xl font-semibold">Heart Rate and SPo2</h3>
        <Line data={data} options={{ responsive: true }} />
      </div>
      <div className="bg-white p-5 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold">Live Location</h3>
        <iframe
          title="Google Maps"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.8354345094326!2d144.96305791590643!3d-37.81410797975193!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf57794ac22a7630!2sFederation%20Square!5e0!3m2!1sen!2sau!4v1632823956034!5m2!1sen!2sau"
          width="100%"
          height="400"
          allowFullScreen=""
          loading="lazy"
          className="rounded-lg shadow-lg"
        ></iframe>
      </div>
    </motion.div>
  );
};

export default Status;
