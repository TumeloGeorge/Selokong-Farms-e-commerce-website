'use client';
import React, { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Chart, 
  LineElement, 
  PointElement, 
  LinearScale, 
  CategoryScale, 
  ArcElement, 
  Tooltip, 
  Legend,
  BarElement,
  Title 
} from 'chart.js';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingDown,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';

// Register Chart.js components
Chart.register(
  LineElement, 
  PointElement, 
  LinearScale, 
  CategoryScale, 
  ArcElement, 
  BarElement,
  Tooltip, 
  Legend,
  Title
);

interface AnalyticsData {
  trafficData: {
    labels: string[];
    data: number[];
  };
  revenueData: {
    labels: string[];
    data: number[];
  };
  salesData: {
    labels: string[];
    data: number[];
  };
  conversionRate: number;
  bounceRate: number;
  avgOrderValue: number;
  totalVisitors: number;
  newUsers: number;
  returningUsers: number;
  topPages: Array<{
    page: string;
    visits: number;
    bounceRate: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    percentage: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
  }>;
  timePeriod: string;
}

export default function AnalyticsView() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const rawData: any = await adminService.getAnalytics(token, timeRange);

      // Map server response to the local AnalyticsData shape expected by the component
      const mapped: AnalyticsData = {
        trafficData: {
          labels: rawData.dailyRevenue?.map((d: any) => d.date) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: rawData.dailyRevenue?.map((d: any) => d.revenue) || [300, 450, 600, 550, 700, 900],
        },
        revenueData: {
          labels: rawData.dailyRevenue?.map((d: any) => d.date) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: rawData.dailyRevenue?.map((d: any) => d.revenue) || [1500, 2300, 1800, 2500, 3200, 2800],
        },
        salesData: {
          labels: rawData.dailyRevenue?.map((d: any) => d.date) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: rawData.dailyRevenue?.map((d: any) => d.sales ?? 0) || [45, 60, 75, 50, 90, 110, 85],
        },
        conversionRate: Number(rawData.summary?.conversionRate ?? 0),
        bounceRate: Number(rawData.summary?.bounceRate ?? 0),
        avgOrderValue: Number(rawData.summary?.averageOrderValue ?? 0),
        totalVisitors: Number(rawData.summary?.totalVisitors ?? rawData.summary?.totalOrders ?? 0),
        newUsers: Number(rawData.newUsers ?? 0),
        returningUsers: Number(rawData.returningUsers ?? 0),
        topPages: (rawData.topProductsByRevenue || rawData.recentActivity || []).slice(0, 10).map((p: any) => ({
          page: p.page || p.name || p.product || 'Unknown',
          visits: Number(p.visits ?? p.salesCount ?? p.revenue ?? 0),
          bounceRate: Number(p.bounceRate ?? 0),
        })),
        deviceBreakdown: rawData.deviceBreakdown ?? [
          { device: 'Desktop', percentage: 55 },
          { device: 'Mobile', percentage: 40 },
          { device: 'Tablet', percentage: 5 },
        ],
        revenueByCategory: (rawData.revenueByCategory || rawData.topProductsByRevenue || []).map((c: any) => ({
          category: c.category || c.name || 'Unknown',
          revenue: Number(c.revenue ?? c.sales ?? 0),
        })),
        timePeriod: rawData.timePeriod || timeRange,
      };

      setAnalyticsData(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    // Export analytics data as CSV
    if (!analyticsData) return;
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Conversion Rate', `${analyticsData.conversionRate}%`],
      ['Bounce Rate', `${analyticsData.bounceRate}%`],
      ['Average Order Value', `P${analyticsData.avgOrderValue}`],
      ['Total Visitors', analyticsData.totalVisitors],
      ['New Users', analyticsData.newUsers],
      ['Returning Users', analyticsData.returningUsers],
      ['', ''],
      ['Page', 'Visits', 'Bounce Rate'],
      ...analyticsData.topPages.map(page => [page.page, page.visits, `${page.bounceRate}%`])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const trafficChartData = {
    labels: analyticsData?.trafficData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Website Traffic',
        data: analyticsData?.trafficData?.data || [300, 450, 600, 550, 700, 900],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const revenueChartData = {
    labels: analyticsData?.revenueData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData?.revenueData?.data || [1500, 2300, 1800, 2500, 3200, 2800],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const salesChartData = {
    labels: analyticsData?.salesData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales',
        data: analyticsData?.salesData?.data || [45, 60, 75, 50, 90, 110, 85],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
    ],
  };

  const revenueByCategoryData = {
    labels: analyticsData?.revenueByCategory?.map(item => item.category) || ['Fruits', 'Vegetables', 'Seeds', 'Tools'],
    datasets: [
      {
        label: 'Revenue by Category',
        data: analyticsData?.revenueByCategory?.map(item => item.revenue) || [4500, 3200, 1800, 900],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
        ],
        borderWidth: 1,
      },
    ],
  };

  const deviceBreakdownData = {
    labels: analyticsData?.deviceBreakdown?.map(item => item.device) || ['Desktop', 'Mobile', 'Tablet'],
    datasets: [
      {
        data: analyticsData?.deviceBreakdown?.map(item => item.percentage) || [55, 40, 5],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Failed to Load Analytics</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Loading Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600">
            Insights for {analyticsData?.timePeriod || 'Last 7 days'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              analyticsData?.conversionRate && analyticsData.conversionRate > 5 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {analyticsData?.conversionRate && analyticsData.conversionRate > 5 ? '↑' : '↓'} 
              {analyticsData?.conversionRate ? analyticsData.conversionRate > 5 ? '18%' : '2%' : '0%'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analyticsData?.conversionRate ? `${analyticsData.conversionRate}%` : '0%'}
          </h3>
          <p className="text-gray-600">Conversion Rate</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              +{analyticsData?.newUsers || 0}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analyticsData?.totalVisitors || 0}
          </h3>
          <p className="text-gray-600">Total Visitors</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              analyticsData?.avgOrderValue && analyticsData.avgOrderValue > 200 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {analyticsData?.avgOrderValue ? `P${analyticsData.avgOrderValue}` : 'P0'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            P{analyticsData?.avgOrderValue ? analyticsData.avgOrderValue.toFixed(2) : '0.00'}
          </h3>
          <p className="text-gray-600">Avg Order Value</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm font-medium bg-red-100 text-red-800 px-2 py-1 rounded-full">
              {analyticsData?.bounceRate || 0}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analyticsData?.bounceRate || 0}%
          </h3>
          <p className="text-gray-600">Bounce Rate</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Website Traffic</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{analyticsData?.timePeriod || 'Last 7 days'}</span>
            </div>
          </div>
          <div className="h-80">
            <Line data={trafficChartData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Growth</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>Total Revenue</span>
            </div>
          </div>
          <div className="h-80">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Overview</h3>
          <div className="h-80">
            <Bar data={salesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Category</h3>
          <div className="h-80">
            <Bar data={revenueByCategoryData} options={chartOptions} />
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Breakdown</h3>
          <div className="h-80">
            <Doughnut data={deviceBreakdownData} options={doughnutOptions} />
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Pages</h3>
          <div className="space-y-4">
            {analyticsData?.topPages?.slice(0, 5).map((page, index) => (
              <div key={page.page} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-700">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{page.page}</p>
                    <p className="text-sm text-gray-600">{page.visits.toLocaleString()} visits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{page.visits.toLocaleString()}</p>
                  <p className={`text-xs ${page.bounceRate > 50 ? 'text-red-600' : 'text-green-600'}`}>
                    {page.bounceRate}% bounce rate
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">New Users</h4>
              <p className="text-2xl font-bold text-blue-600">{analyticsData?.newUsers || 0}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Users who visited for the first time</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Returning Users</h4>
              <p className="text-2xl font-bold text-green-600">{analyticsData?.returningUsers || 0}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Users who have visited before</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">User Engagement</h4>
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData?.conversionRate ? `${analyticsData.conversionRate}%` : '0%'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Conversion rate from visitor to customer</p>
        </div>
      </div>
    </div>
  );
}