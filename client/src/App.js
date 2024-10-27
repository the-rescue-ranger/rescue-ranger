import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "./Home";
import Status from "./Status";
import About from "./About";
import Emergency from "./Emergency";

function App() {
  return (
    <Router>
      <div className="p-5 bg-gray-100">
        <nav className="flex space-x-4">
          <Link to="/" className="text-blue-500">Home</Link>
          <Link to="/status" className="text-blue-500">Status</Link>
          <Link to="/about" className="text-blue-500">About Us</Link>
          <Link to="/emergency" className="text-blue-500">Emergency</Link> {/* New link */}
        </nav>

        <div className="mt-5">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/status" element={<Status />} />
            <Route path="/about" element={<About />} />
            <Route path="/emergency" element={<Emergency />} /> {/* New route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
