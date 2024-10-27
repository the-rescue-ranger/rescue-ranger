import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "./Home";
import Status from "./Status";
import About from "./About";
import Emergency from "./Emergency";
import './styles.css'; // Include your new styles

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h1 className="logo">Rescue Ranger</h1>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/status">Status</Link>
            <Link to="/about">About Us</Link>
            <Link to="/emergency">Emergency</Link>
          </div>
        </nav>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/status" element={<Status />} />
            <Route path="/about" element={<About />} />
            <Route path="/emergency" element={<Emergency />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
