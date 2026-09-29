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
  CreditCard,
  FileText,
  FileSpreadsheet,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Key,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Change Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();
  const shopSettings = store.getShopSettings();

  const handleLogout = () => {
    store.setCurrentUser(null);
    router.push('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentUser) return;
    if (newPass !== confirmPass) {
      setPassError('New password and confirm password do not match.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    const res = await store.changePassword(currentUser.id, currentPass, newPass);
    if (res.success) {
      setPassSuccess(res.message);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassSuccess(null);
      }, 1500);
    } else {
      setPassError(res.message);
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN';

  // Exact Admin Sidebar Navigation
  const adminNavItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Delivery Boys', href: '/admin/delivery-boys', icon: UserCheck },
    { label: 'Deliveries', href: '/admin/deliveries', icon: Truck },
    { label: 'Bills', href: '/admin/invoices', icon: FileText },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Expenses', href: '/admin/expenses', icon: Receipt },
    { label: 'Reports', href: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const dboyNavItems = [
    { label: "Today's Deliveries", href: '/delivery-boy', icon: Truck },
    { label: 'Delivery History', href: '/delivery-boy/history', icon: FileText },
  ];

  // Useful alerts for Admin
  const pendingInvoicesCount = store.getInvoices().filter((i) => i.status === 'GENERATED' || i.recalculation_required).length;
  const recalculationNeededCount = store.getInvoices().filter((i) => i.recalculation_required).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <OfflineBanner />

      {/* Top Header */}
      <header className="bg-nandini-blue text-white sticky top-0 z-40 shadow-md border-b border-blue-900 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-blue-800 focus:outline-none"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-16 bg-white rounded-lg p-0.5 flex items-center justify-center shadow-xs">
                <img
                  src="/logo.png"
                  alt="Nandini Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight">
                  {shopSettings?.shop_name || 'NANDINI MILK PARLOUR'}
                </h1>
                <p className="text-[10px] sm:text-xs text-blue-200">
                  {isAdmin ? 'Shop Administration Workspace' : 'Delivery Boy Mobile Portal'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Notification Bell for Admin */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 rounded-lg hover:bg-blue-800 relative transition"
                  title="System Notifications"
                >
                  <Bell className="w-5 h-5 text-blue-100" />
                  {recalculationNeededCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-nandini-blue animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Shop Alerts</span>
                      <span className="text-xs text-blue-600 font-semibold">{pendingInvoicesCount} Active</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {recalculationNeededCount > 0 ? (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">Bill Recalculation Required</div>
                            <div className="text-[11px] text-amber-800">
                              {recalculationNeededCount} bill(s) affected by delivery adjustments.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>All shop bills are up to date!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{currentUser.role}</div>
                  </div>

                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Settings</span>
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition text-left"
                  >
                    <Key className="w-4 h-4 text-slate-500" />
                    <span>Change Password</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex bg-slate-50">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 bg-white border-r border-slate-200 shrink-0 shadow-xs">
          <nav className="p-3.5 space-y-1.5 sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto">
            {(isAdmin ? adminNavItems : dboyNavItems).map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                    active
                      ? 'bg-nandini-blue text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
            <div className="relative bg-white w-72 max-w-xs h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left">
              <div className="p-4 bg-nandini-blue text-white flex items-center justify-between">
                <span className="font-bold text-sm">Navigation Menu</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-blue-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
                {(isAdmin ? adminNavItems : dboyNavItems).map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-bold transition ${
                        active
                          ? 'bg-nandini-blue text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-nandini-blue font-bold text-base">
                <Key className="w-5 h-5" />
                <span>Change Password</span>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nandini-blue text-white font-bold rounded-xl text-xs hover:bg-blue-800 shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
