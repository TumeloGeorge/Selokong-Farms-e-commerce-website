'use client';
import React, { useState } from 'react';

export default function ReportsView() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('sales');

  const handleGenerate = () => {
    alert(`Generating ${type} report from ${from} to ${to}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Report Generator</h2>

      <div className="bg-white p-6 rounded-lg shadow w-1/2">
        <div className="mb-4">
          <label className="block text-gray-700">Report Type</label>
          <select
            className="border rounded w-full p-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="analytics">Website Analytics Report</option>
          </select>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-gray-700">From</label>
            <input
              type="date"
              className="border rounded w-full p-2"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700">To</label>
            <input
              type="date"
              className="border rounded w-full p-2"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
