'use client';
import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Printer,
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';

interface ReportData {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  salesByDate: Array<{
    date: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity_sold: number;
    revenue: number;
    emoji: string;
  }>;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  customerSegments: Array<{
    segment: string;
    customers: number;
    revenue: number;
  }>;
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
}

export default function ReportsView() {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'analytics' | 'customers'>('sales');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    
    const from = new Date(today);
    if (dateRange === '7d') from.setDate(from.getDate() - 7);
    else if (dateRange === '30d') from.setDate(from.getDate() - 30);
    else if (dateRange === '90d') from.setDate(from.getDate() - 90);
    else if (dateRange === '1y') from.setFullYear(from.getFullYear() - 1);
    
    const fromStr = from.toISOString().split('T')[0];
    
    setFromDate(dateRange === 'custom' ? fromDate : fromStr);
    setToDate(dateRange === 'custom' ? toDate : to);
  }, [dateRange]);

  const generateReport = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams({
        type: reportType,
        from: fromDate,
        to: toDate,
        include_charts: includeCharts.toString()
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
      
      setSuccess(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      // Build query parameters
      const params = new URLSearchParams({
        type: reportType,
        from: fromDate,
        to: toDate,
        format: format,
        include_charts: includeCharts.toString()
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/admin/reports/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${fromDate}-to-${toDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Report exported as ${format.toUpperCase()} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const sendReportEmail = async () => {
    if (!reportData) {
      setError('Please generate a report first');
      return;
    }

    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/admin/reports/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: reportType,
          from: fromDate,
          to: toDate,
          format: format,
          recipient_email: '' // Would come from user input in a real app
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send report');
      }

      setSuccess('Report sent to email successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send report');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    if (!reportData) {
      setError('Please generate a report first');
      return;
    }
    
    const printContent = document.getElementById('report-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #16A34A; }
                .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f3f4f6; }
                .metric-card { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; }
              </style>
            </head>
            <body>
              <h1>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
              <p>Period: ${fromDate} to ${toDate}</p>
              <p>Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getReportIcon = () => {
    switch (reportType) {
      case 'sales': return <TrendingUp className="w-5 h-5" />;
      case 'inventory': return <Package className="w-5 h-5" />;
      case 'analytics': return <BarChart3 className="w-5 h-5" />;
      case 'customers': return <Users className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'sales': return 'Detailed sales analysis including revenue, orders, and customer metrics';
      case 'inventory': return 'Inventory status, stock levels, and product performance';
      case 'analytics': return 'Website analytics, traffic sources, and user behavior';
      case 'customers': return 'Customer segmentation, acquisition, and retention analysis';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Generator</h2>
          <p className="text-gray-600">Generate detailed business reports and analytics</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Report Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
            
            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    {getReportIcon()}
                    <span>Report Type</span>
                  </div>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                >
                  <option value="sales">Sales Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="analytics">Website Analytics Report</option>
                  <option value="customers">Customer Analysis Report</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getReportDescription()}
                </p>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>Date Range</span>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['7d', '30d', '90d', '1y', 'custom'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range as any)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        dateRange === range
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs */}
              {dateRange === 'custom' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      max={toDate}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>Export Format</span>
                  </div>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['pdf', 'csv', 'excel'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt as any)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        format === fmt
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeCharts"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                  />
                  <label htmlFor="includeCharts" className="text-sm text-gray-700">
                    Include charts and graphs
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={generateReport}
                  disabled={loading || !fromDate || !toDate}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Generate Report
                    </>
                  )}
                </button>

                {reportData && (
                  <>
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-600 mb-2">Export Options:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={exportReport}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={printReport}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                          Print
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Period</span>
                <span className="font-semibold">
                  {fromDate} to {toDate}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Days</span>
                <span className="font-semibold">
                  {Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Report Type</span>
                <span className="font-semibold capitalize">{reportType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Report Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Generated: {reportData ? new Date(reportData.generatedAt).toLocaleString() : 'Not generated yet'}
                </span>
              </div>
            </div>

            {reportData ? (
              <div id="report-content">
                {/* Report Header */}
                <div className="text-center mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {getReportIcon()}
                    <h2 className="text-2xl font-bold text-gray-900">
                      {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    Period: {reportData.period.from} to {reportData.period.to}
                  </p>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-600">Total Sales</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">P{reportData.summary.totalSales.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalOrders.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">Total Customers</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalCustomers.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium text-gray-600">Avg Order Value</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">P{reportData.summary.averageOrderValue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Sales Trend */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Revenue</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Orders</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customers</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportData.salesByDate.slice(0, 5).map((day, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{day.date}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-700">P{day.revenue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{day.orders}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{day.customers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Products */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h4>
                  <div className="space-y-3">
                    {reportData.topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{product.emoji}</div>
                          <div>
                            <p className="font-semibold text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.quantity_sold.toLocaleString()} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">P{product.revenue.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales by Category */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h4>
                  <div className="space-y-2">
                    {reportData.salesByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{category.category}</span>
                            <span className="text-sm font-semibold text-gray-900">P{category.revenue.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{category.percentage}% of total revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Segments */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportData.customerSegments.map((segment, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-900 mb-2">{segment.segment}</p>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {segment.customers.toLocaleString()} customers
                          </p>
                          <p className="text-sm font-semibold text-green-700">
                            P{segment.revenue.toLocaleString()} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
                <p className="text-gray-600 mb-4">
                  Configure your report settings and click "Generate Report" to view insights
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Preview will appear here</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}