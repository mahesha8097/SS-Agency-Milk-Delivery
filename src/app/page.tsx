'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Milk, Shield, Truck, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = store.login(username, role);
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/delivery-boy');
      }
    } else {
      setError(`Invalid credentials for ${role === 'ADMIN' ? 'Admin' : 'Delivery Boy'}.`);
    }
  };

  const setDemoCredentials = (targetRole: UserRole, targetUser: string) => {
    setRole(targetRole);
    setUsername(targetUser);
    setPassword(targetUser === 'admin' ? 'admin123' : targetUser === 'boy1' ? 'boy123' : 'boy223');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-nandini-blue text-white shadow-md mb-4">
          <Milk className="w-10 h-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          S.S AGENCY
        </h1>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          Nandini Milk & Dairy Door-to-Door Delivery Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setUsername('admin');
                setPassword('admin123');
                setError(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition ${
                role === 'ADMIN'
                  ? 'bg-nandini-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('DELIVERY_BOY');
                setUsername('boy1');
                setPassword('boy123');
                setError(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition ${
                role === 'DELIVERY_BOY'
                  ? 'bg-nandini-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Delivery Boy</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs md:text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username / Login ID
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nandini-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nandini-blue"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-nandini-blue hover:bg-nandini-dark active:bg-blue-900 text-white py-3 px-4 rounded-lg font-bold text-sm shadow-sm transition flex items-center justify-center space-x-2"
            >
              <span>Login to {role === 'ADMIN' ? 'Admin Portal' : 'Delivery Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Quick Demo Access Buttons
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('ADMIN', 'admin')}
                className="px-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 text-center"
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('DELIVERY_BOY', 'boy1')}
                className="px-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 text-center"
              >
                🚚 Boy 1 (Route 1)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('DELIVERY_BOY', 'boy2')}
                className="px-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 text-center"
              >
                🚚 Boy 2 (Route 2)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
