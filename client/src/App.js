import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "./components/Home";
import Status from "./components/Status";
import About from "./components/About";

function App() {
  return (
    <Router>
      <div className="p-5 bg-gray-100">
        <nav className="flex space-x-4">
          <Link to="/" className="text-blue-500">Home</Link>
          <Link to="/status" className="text-blue-500">Status</Link>
          <Link to="/about" className="text-blue-500">About Us</Link>
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
