'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/authContext';
import Sidebar from '@/components/admin/sidebar';
import DashboardView from '@/components/admin/DashboardView';
import AnalyticsView from '@/components/admin/AnalyticsView';
import InventoryView from '@/components/admin/InventoryView';
import UserManager from '@/components/admin/UserManager';
import ReportsView from '@/components/admin/ReportsView';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff'))) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null; // Will redirect in useEffect
  }

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
