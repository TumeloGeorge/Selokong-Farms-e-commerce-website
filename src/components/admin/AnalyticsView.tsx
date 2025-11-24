'use client';
import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend);

export default function AnalyticsView() {
  const trafficData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Traffic',
        data: [300, 450, 600, 550, 700, 900],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const revenueData = {
    labels: ['Orders', 'Products Sold', 'Returns'],
    datasets: [
      {
        data: [85, 10, 5],
        backgroundColor: ['#16A34A', '#60A5FA', '#F87171'],
      },
    ],
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Overview</h2>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Website Traffic</h3>
          <Line data={trafficData} />
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Summary</h3>
          <Doughnut data={revenueData} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h4 className="text-sm text-gray-600">Revenue Growth</h4>
          <p className="text-2xl font-bold text-green-600">+18%</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <h4 className="text-sm text-gray-600">New Users</h4>
          <p className="text-2xl font-bold text-yellow-600">+230</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <h4 className="text-sm text-gray-600">Bounce Rate</h4>
          <p className="text-2xl font-bold text-red-600">12%</p>
        </div>
      </div>
    </div>
  );
}
