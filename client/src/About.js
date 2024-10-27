import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <motion.div
      className="p-5 bg-white rounded-lg shadow-lg"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold">About Us</h1>
      <p className="mt-4 text-gray-600">
        We are a tech company committed to bringing innovative products like smart watches to enhance your daily health and lifestyle.
      </p>
    </motion.div>
  );
};

export default About;
