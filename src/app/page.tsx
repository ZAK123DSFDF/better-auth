"use client"; // required to use useState, useEffect, or onClick

import React, { useState } from "react";

const Home = () => {
  const [data, setData] = useState(null);

  const fetchAffiliateData = async () => {
    try {
      const res = await fetch(
        "https://affiliate-marketing-ten.vercel.app/api/org?code=pFEBLc",
      );
      if (!res.ok) {
        throw new Error("Failed to fetch affiliate data");
      }
      const json = await res.json();
      console.log("Affiliate data:", json);
      setData(json); // You can use this to show it on the page
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Home</h1>

      <button
        onClick={fetchAffiliateData}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Fetch Affiliate Data
      </button>

      {data && (
        <div className="mt-4 p-4 bg-gray-100 rounded shadow">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Home;
