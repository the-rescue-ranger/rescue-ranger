import React from "react";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <motion.div
      className="p-5 bg-white rounded-lg shadow-lg"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold">Smart Watch</h1>
      <p className="mt-4 text-gray-600">
        Our smart watch offers heart rate monitoring, SPo2 tracking, and live location services. It’s the perfect fitness companion!
      </p>
      <img src="watch-image.jpg" alt="Watch" className="mt-4 rounded-lg" />
    </motion.div>
  );
};

export default Home;
