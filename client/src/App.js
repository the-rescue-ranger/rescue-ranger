import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "./Home";
import Status from "./Status";
import About from "./About";

function App() {
  return (
    <Router>
      <div className="bg-gray-100">
        <nav className="flex justify-around items-center bg-blue-500 p-4 shadow-md">
          <Link to="/" className="text-white font-semibold text-lg">Home</Link>
          <Link to="/status" className="text-white font-semibold text-lg">Status</Link>
          <Link to="/about" className="text-white font-semibold text-lg">About Us</Link>
          <a href="https://github.com/the-rescue-ranger" className="text-white font-semibold text-lg" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>

        <div className="mt-5">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/status" element={<Status />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
