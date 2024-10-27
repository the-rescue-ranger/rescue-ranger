import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "./Home";
import Status from "./Status";
import About from "./About";
import Emergency from "./Emergency";
import { motion } from "framer-motion";

function App() {
  return (
    <Router>
      <div className="bg-custom min-h-screen p-5">
        <header className="flex justify-between items-center mb-5 shadow-lg bg-white p-4 rounded-lg">
          <h1 className="text-2xl font-bold text-blue-600">Rescue Ranger</h1>
          <nav className="space-x-4">
            <Link to="/" className="text-blue-500 hover:text-blue-700 transition">Home</Link>
            <Link to="/status" className="text-blue-500 hover:text-blue-700 transition">Status</Link>
            <Link to="/about" className="text-blue-500 hover:text-blue-700 transition">About Us</Link>
            <Link to="/emergency" className="text-blue-500 hover:text-blue-700 transition">Emergency</Link>
            <a 
              href="https://github.com/the-rescue-ranger" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:text-blue-700 transition"
            >
              GitHub
            </a>
          </nav>
        </header>

        <main>
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
        </main>
      </div>
    </Router>
  );
}

export default App;
