import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "./Home";
import Status from "./Status";
import About from "./About";
import Emergency from "./Emergency"; // Import Emergency component
import { motion } from "framer-motion"; // Import framer-motion for animations

function App() {
  return (
    <Router>
      <div className="p-5 bg-gray-100">
        <nav className="flex justify-between items-center mb-5">
          <div className="flex space-x-4">
            <Link to="/" className="text-blue-500 hover:text-blue-700 transition duration-300">Home</Link>
            <Link to="/status" className="text-blue-500 hover:text-blue-700 transition duration-300">Status</Link>
            <Link to="/about" className="text-blue-500 hover:text-blue-700 transition duration-300">About Us</Link>
            <Link to="/emergency" className="text-blue-500 hover:text-blue-700 transition duration-300">Emergency</Link>
          </div>
          <a 
            href="https://github.com/the-rescue-ranger" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:text-blue-700 transition duration-300"
          >
            GitHub
          </a>
        </nav>

        <div className="mt-5">
          <Routes>
            <Route 
              path="/" 
              element={
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Home />
                </motion.div>
              } 
            />
            <Route 
              path="/status" 
              element={
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Status />
                </motion.div>
              } 
            />
            <Route 
              path="/about" 
              element={
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <About />
                </motion.div>
              } 
            />
            <Route 
              path="/emergency" 
              element={
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Emergency />
                </motion.div>
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
