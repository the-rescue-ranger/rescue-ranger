import React from "react";

const Home = () => {
  return (
    <div className="p-5 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold">Smart Watch</h1>
      <p className="mt-4 text-gray-600">
        Our smart watch offers heart rate monitoring, SPo2 tracking, and live location services. It’s the perfect fitness companion!
      </p>
      <img src="watch-image.jpg" alt="Watch" className="mt-4 rounded-lg" />
    </div>
  );
};

export default Home;
