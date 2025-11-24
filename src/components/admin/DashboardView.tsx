'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function DashboardView() {
  const visitsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Website Visits',
        data: [120, 190, 300, 500, 200, 300, 400],
        backgroundColor: 'rgba(16, 185, 129, 0.5)', // green-500
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
  };

  const metrics = [
    { label: 'Total Users', value: 1234, color: 'text-green-700' },
    { label: 'Orders This Week', value: 87, color: 'text-blue-700' },
    { label: 'Revenue', value: 'P45,230', color: 'text-emerald-700' },
    { label: 'Out of Stock', value: 5, color: 'text-red-600' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white shadow rounded-lg p-4">
            <p className="text-gray-500">{metric.label}</p>
            <h3 className={`text-2xl font-bold ${metric.color}`}>{metric.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Website Visits</h3>
        <Bar data={visitsData} />
      </div>
    </div>
  );
}
