import React from 'react';
import {
  LayoutDashboard,
  BarChart2,
  Package,
  Users,
  FileText,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
    { key: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
    { key: 'users', label: 'User Manager', icon: <Users size={20} /> },
    { key: 'reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-green-700">Admin Panel</h1>
        <p className="text-sm text-gray-500">Selokong Farms</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors ${
              activeView === item.key
                ? 'bg-green-100 text-green-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={() => alert('Logging out...')}
          className="flex items-center gap-3 w-full p-3 rounded-lg text-left text-gray-700 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
