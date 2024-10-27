import React from "react";
import { motion } from "framer-motion";

const Home = () => {
  return (
    <motion.section
      className="flex flex-col items-center justify-center h-screen text-center bg-blue-200 p-10 rounded-lg shadow-lg"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl font-bold mb-4">Welcome to Rescue Ranger</h1>
      <p className="text-lg text-gray-700 mb-8">
        Your reliable companion for health monitoring and emergency alerts.
      </p>
      <a 
        href="/status" 
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
      >
        Check Status
      </a>
    </motion.section>
  );
};

export default Home;
