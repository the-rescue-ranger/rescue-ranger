import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <motion.div
      className="p-5 bg-white rounded-lg shadow-lg"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold">About Us</h1>
      <p className="mt-4 text-gray-600">
        Rescue Ranger is dedicated to providing smart health monitoring solutions.
        We aim to empower users with real-time data and emergency alerts for a safer lifestyle.
      </p>
    </motion.div>
  );
};

export default About;
