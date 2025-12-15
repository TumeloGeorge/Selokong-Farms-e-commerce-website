'use client';
import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { TrendingUp, ShoppingCart, Users, Package, AlertCircle, DollarSign } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';

Chart.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  outOfStock: number;
  weeklyVisits: number[];
  recentOrders: any[];
  topProducts: any[];
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const data = await adminService.getDashboardStats(token);
      setStats(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button onClick={loadDashboardData} className="mt-2 text-red-600 underline">
          Retry
        </button>
      </div>
    );
  }

  const visitsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Website Visits',
        data: stats?.weeklyVisits || [120, 190, 300, 500, 200, 300, 400],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
  };

  const metrics = [
    { 
      label: 'Total Users', 
      value: stats?.totalUsers || 0, 
      color: 'text-green-700',
      icon: Users,
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Pending Orders', 
      value: stats?.pendingOrders || 0, 
      color: 'text-blue-700',
      icon: ShoppingCart,
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'Total Revenue', 
      value: `P${stats?.totalRevenue?.toFixed(2) || '0.00'}`, 
      color: 'text-emerald-700',
      icon: DollarSign,
      bgColor: 'bg-emerald-100'
    },
    { 
      label: 'Out of Stock', 
      value: stats?.outOfStock || 0, 
      color: 'text-red-600',
      icon: AlertCircle,
      bgColor: 'bg-red-100'
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-sm">{metric.label}</p>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
              <h3 className={`text-3xl font-bold ${metric.color}`}>{metric.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Website Visits</h3>
          <Bar data={visitsData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
          <div className="space-y-3">
            {stats?.topProducts?.slice(0, 5).map((product: any, index: number) => (
              <div key={`${product.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.emoji || '📦'}</span>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.sales_count} sales</p>
                  </div>
                </div>
                <span className="font-bold text-green-700">P{product.total_revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order #</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.recentOrders?.map((order: any) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm">{order.customer_name}</td>
                  <td className="px-4 py-3 text-sm font-semibold">P{order.total_amount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}