import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center p-8 bg-gradient-to-r from-blue-500 to-indigo-500 min-h-screen text-white">
      <h1 className="text-5xl font-bold mb-4 animate__animated animate__fadeInDown">
        Rescue Ranger
      </h1>
      <p className="text-xl mb-6 animate__animated animate__fadeIn animate__delay-1s">
        Live.Think.Care
      </p>
      <img src="logo.jpeg" alt="Rescue Ranger" className="mt-4 rounded-lg shadow-lg animate__animated animate__zoomIn" />
      <a href="https://resku.odoo.com" className="mt-6 px-4 py-2 bg-white text-blue-500 rounded-lg shadow-lg transition-transform transform hover:scale-105">
        Explore Features
      </a>
    </div>
  );
};

export default Home;
