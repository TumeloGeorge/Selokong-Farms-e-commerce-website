'use client';
import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import DashboardView from '@/components/admin/DashboardView';
import AnalyticsView from '@/components/admin/AnalyticsView';
import InventoryView from '@/components/admin/InventoryView';
import UserManager from '@/components/admin/UserManager';
import ReportsView from '@/components/admin/ReportsView';

export default function AdminPage() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'inventory':
        return <InventoryView />;
      case 'users':
        return <UserManager />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 p-8 overflow-y-auto">{renderView()}</main>
    </div>
  );
}
