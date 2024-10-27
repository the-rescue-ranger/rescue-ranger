import React from "react";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Home from "./Home";
import Status from "./Status";
import About from "./About";
import Emergency from "./Emergency"; // New Emergency component
import './styles.css'; // Ensure to import custom styles

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-r from-blue-400 to-teal-400">
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg p-4 flex justify-around z-10">
          <Link to="/" className="tab">Home</Link>
          <Link to="/status" className="tab">Status</Link>
          <Link to="/about" className="tab">About Us</Link>
          <Link to="/emergency" className="tab">Emergency</Link>
        </nav>

        <div className="mt-16 p-5">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/status" element={<Status />} />
            <Route path="/about" element={<About />} />
            <Route path="/emergency" element={<Emergency />} />
          </Routes>
        </div>

        <footer className="bg-white p-4 text-center">
          <p>Check out my projects on <a href="https://github.com/the-rescue-ranger" className="text-blue-500">GitHub</a></p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
