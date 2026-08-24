'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  UserCheck,
  MapPin,
  CreditCard,
  FileText,
  FileSpreadsheet,
  History,
  LogOut,
  Menu,
  X,
  Milk,
  RefreshCcw,
} from 'lucide-react';
import { store } from '@/lib/store';
import OfflineBanner from './OfflineBanner';

interface NavigationProps {
  children?: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = store.getCurrentUser();

  const handleLogout = () => {
    store.setCurrentUser(null);
    router.push('/');
  };

  const handleResetDemoData = () => {
    if (confirm('Reset system to initial demo sample data?')) {
      store.seedDemoData();
      window.location.reload();
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN';

  const adminNav = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Daily Deliveries', href: '/admin/deliveries', icon: Truck },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Delivery Boys', href: '/admin/delivery-boys', icon: UserCheck },
    { label: 'Routes', href: '/admin/routes', icon: MapPin },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Monthly Bills', href: '/admin/invoices', icon: FileText },
    { label: 'Excel Reports', href: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  const dboyNav = [
    { label: "Today's Deliveries", href: '/delivery-boy', icon: Truck },
    { label: 'Delivery History', href: '/delivery-boy/history', icon: History },
    { label: 'Delivery Issues', href: '/delivery-boy/issues', icon: Package },
  ];

  const navItems = isAdmin ? adminNav : dboyNav;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <OfflineBanner />

      {/* Top Header */}
      <header className="bg-nandini-blue text-white sticky top-0 z-40 shadow-sm border-b border-blue-900 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-md hover:bg-blue-800 focus:outline-none"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-2.5">
              <img
                src="/logo.png"
                alt="Nandini S.S Agency Logo"
                className="h-10 w-auto max-w-[90px] rounded-md object-contain bg-white p-0.5 border border-blue-200/50 shadow-xs"
              />
              <div>
                <h1 className="font-bold text-base md:text-lg leading-none tracking-tight">S.S AGENCY</h1>
                <p className="text-[10px] md:text-xs text-blue-200">Nandini Milk Delivery Management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs md:text-sm">
            <div className="hidden sm:block text-right">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-blue-200 text-[11px]">
                {isAdmin ? 'System Admin' : 'Delivery Boy'}
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={handleResetDemoData}
                title="Reset Sample Data"
                className="hidden md:flex items-center space-x-1 bg-blue-800 hover:bg-blue-700 px-2.5 py-1.5 rounded text-xs text-blue-100"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-red-700 hover:bg-red-800 px-2.5 py-1.5 rounded text-xs text-white transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Row Container */}
      <div className="flex-1 flex bg-slate-50">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 shrink-0">
          <nav className="p-4 space-y-1 sticky top-[60px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-nandini-blue text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative bg-white w-72 max-w-full h-full shadow-xl flex flex-col p-4 z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="font-bold text-slate-900 text-base">Menu</div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded bg-slate-100 text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="py-4 space-y-1 overflow-y-auto flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-nandini-blue text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 mb-2">Logged in as {currentUser.name}</div>
                {isAdmin && (
                  <button
                    onClick={handleResetDemoData}
                    className="w-full mb-2 flex items-center justify-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-medium"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page Content next to Sidebar */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
