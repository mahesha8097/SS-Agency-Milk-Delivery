'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Truck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  X,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = store.login(username, role, password);
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/delivery-boy');
      }
    } else {
      setError(`Invalid username or password for ${role === 'ADMIN' ? 'Admin Portal' : 'Delivery Boy'}.`);
    }
  };

  const switchRoleTab = (newRole: UserRole) => {
    setRole(newRole);
    setError(null);
    if (newRole === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('boy1');
      setPassword('boy123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-24 w-44 rounded-2xl bg-white shadow-md p-2 border-2 border-nandini-blue mb-3">
          <img src="/logo.png" alt="Nandini S.S Agency Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          S.S AGENCY
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
          Nandini Milk & Dairy Door-to-Door Delivery Management
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-slate-200 rounded-2xl sm:px-10 space-y-6">

          {/* Role Selection Tabs */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Select Login Portal
            </div>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => switchRoleTab('ADMIN')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-xs sm:text-sm font-bold transition ${
                  role === 'ADMIN'
                    ? 'bg-nandini-blue text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => switchRoleTab('DELIVERY_BOY')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-lg text-xs sm:text-sm font-bold transition ${
                  role === 'DELIVERY_BOY'
                    ? 'bg-nandini-blue text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Delivery Boy</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {role === 'ADMIN' ? 'Admin Username' : 'Delivery Boy Login ID'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'ADMIN' ? 'Enter admin username' : 'e.g. boy1'}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-nandini-blue hover:underline font-semibold flex items-center space-x-1"
                >
                  <Key className="w-3 h-3" />
                  <span>Forgot Password?</span>
                </button>
              </div>

              {/* Password Input with Eye Symbol */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-nandini-blue hover:bg-blue-800 active:scale-[0.99] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>Sign In as {role === 'ADMIN' ? 'Administrator' : 'Delivery Boy'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Preset Demo Login Details
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  switchRoleTab('ADMIN');
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className="px-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 text-center transition"
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRoleTab('DELIVERY_BOY');
                  setUsername('boy1');
                  setPassword('boy123');
                }}
                className="px-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 text-center transition"
              >
                🚚 Boy 1 (Ramesh)
              </button>
              <button
                type="button"
                onClick={() => {
                  switchRoleTab('DELIVERY_BOY');
                  setUsername('boy2');
                  setPassword('boy223');
                }}
                className="px-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 text-center transition"
              >
                🚚 Boy 2 (Suresh)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-nandini-blue font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>Password Help & Recovery</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-nandini-blue shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Default System Credentials</div>
                  <div className="mt-1 space-y-0.5 text-xs">
                    <div>• <b>Admin:</b> Username: <code className="bg-white px-1 rounded font-bold">admin</code> / Password: <code className="bg-white px-1 rounded font-bold">admin123</code></div>
                    <div>• <b>Delivery Boy 1:</b> Username: <code className="bg-white px-1 rounded font-bold">boy1</code> / Password: <code className="bg-white px-1 rounded font-bold">boy123</code></div>
                    <div>• <b>Delivery Boy 2:</b> Username: <code className="bg-white px-1 rounded font-bold">boy2</code> / Password: <code className="bg-white px-1 rounded font-bold">boy223</code></div>
                  </div>
                </div>
              </div>

              <p>
                If you are a Delivery Boy and forgot your custom password, please contact the <b>S.S Agency Administrator</b> to view or update your login credentials in the Admin Panel.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  if (role === 'ADMIN') {
                    setUsername('admin');
                    setPassword('admin123');
                  } else {
                    setUsername('boy1');
                    setPassword('boy123');
                  }
                }}
                className="px-4 py-2 bg-nandini-blue text-white font-semibold rounded-lg text-xs"
              >
                Use Default Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
