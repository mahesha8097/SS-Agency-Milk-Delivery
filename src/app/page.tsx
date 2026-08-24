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
  Smartphone,
  UserCheck,
  UserPlus,
  Send,
} from 'lucide-react';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [authMethod, setAuthMethod] = useState<'PHONE' | 'USERNAME'>('PHONE');

  // Phone & OTP state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  // Username & Password state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);

  // Create Admin Form State
  const [adminForm, setAdminForm] = useState({
    name: 'S.S Agency Admin',
    phone: '9876543210',
    username: 'admin',
    password: '',
  });

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setUserOtp('');
    setOtpSent(true);
    setOtpNotification(`OTP Code sent to +91 ${phone}: ${code}`);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (userOtp.trim() !== generatedOtp) {
      setError('Invalid OTP code. Please enter the 6-digit OTP code shown above.');
      return;
    }

    let user = store.loginByPhone(phone, role);
    if (!user) {
      // Auto-register user by mobile number
      user = store.saveUser({
        name: role === 'ADMIN' ? 'Admin User' : 'Delivery Boy',
        phone: phone,
        role: role,
        status: 'ACTIVE',
        username: phone,
      });
      store.setCurrentUser(user);
    }

    if (user.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/delivery-boy');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMethod === 'PHONE') {
      if (!otpSent) {
        handleSendOtp();
        return;
      }
      handleVerifyOtp(e);
      return;
    }

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

  const handleGoogleLogin = () => {
    setError(null);
    store.loginWithGoogle(
      role === 'ADMIN' ? 'admin@ssagency.com' : 'deliveryboy@ssagency.com',
      role === 'ADMIN' ? 'S.S Agency Admin' : 'Delivery Boy',
      role
    );
    if (role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/delivery-boy');
    }
  };

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.phone || !adminForm.username || !adminForm.password) {
      alert('Please fill out all admin details.');
      return;
    }

    // Save Admin Account
    const existingAdmin = store.getUsers().find((u) => u.role === 'ADMIN');
    const newAdmin = store.saveUser({
      id: existingAdmin?.id,
      name: adminForm.name,
      phone: adminForm.phone,
      role: 'ADMIN',
      status: 'ACTIVE',
      username: adminForm.username,
      password: adminForm.password,
    });

    store.setCurrentUser(newAdmin);
    setShowCreateAdminModal(false);
    router.push('/admin');
  };

  const switchRoleTab = (newRole: UserRole) => {
    setRole(newRole);
    setError(null);
    setPhone('');
    setOtpSent(false);
    setOtpNotification(null);
    setUsername('');
    setPassword('');
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
        <div className="bg-white py-8 px-6 shadow-md border border-slate-200 rounded-2xl sm:px-10 space-y-5">

          {/* Role Selection Tabs */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Select Portal
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
                <span>Admin Portal</span>
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

          {/* Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              Or Sign In With
            </span>
          </div>

          {/* Auth Method Switcher (Mobile Number vs Username) */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('PHONE');
                setError(null);
                setOtpNotification(null);
              }}
              className={`flex-1 py-2 text-center rounded-md transition flex items-center justify-center space-x-1.5 ${
                authMethod === 'PHONE'
                  ? 'bg-white text-nandini-blue shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('USERNAME');
                setError(null);
                setOtpNotification(null);
              }}
              className={`flex-1 py-2 text-center rounded-md transition flex items-center justify-center space-x-1.5 ${
                authMethod === 'USERNAME'
                  ? 'bg-white text-nandini-blue shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Username Login</span>
            </button>
          </div>

          {/* OTP Notification Banner */}
          {otpNotification && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between">
              <span>{otpNotification}</span>
              <button
                type="button"
                onClick={() => setOtpNotification(null)}
                className="text-emerald-600 hover:text-emerald-900 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {authMethod === 'PHONE' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setOtpSent(false);
                        setOtpNotification(null);
                      }}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full pl-12 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50/50 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={userOtp}
                      onChange={(e) => setUserOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP (e.g. 123456)"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {role === 'ADMIN' ? 'Admin Username' : 'Delivery Boy Login ID'}
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === 'ADMIN' ? 'Enter admin username' : 'Enter login ID'}
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
              </>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-nandini-blue hover:bg-blue-800 active:scale-[0.99] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
            >
              {authMethod === 'PHONE' ? (
                otpSent ? (
                  <>
                    <span>Verify OTP & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Get OTP Code</span>
                  </>
                )
              ) : (
                <>
                  <span>Sign In as {role === 'ADMIN' ? 'Administrator' : 'Delivery Boy'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Set Up / Create Admin Credentials Link */}
          {role === 'ADMIN' && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-nandini-blue hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create or Update Admin Account</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Create / Update Admin Account Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-nandini-blue font-bold text-base">
                <Shield className="w-5 h-5" />
                <span>Set Up Admin Credentials</span>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. S.S Agency Admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Admin Username / Login ID *
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  placeholder="e.g. admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Admin Password *
                </label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Set admin password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-nandini-blue text-white rounded-lg font-semibold hover:bg-nandini-dark shadow-xs"
                >
                  Save & Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-nandini-blue font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>Password Recovery</span>
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
                  <div className="font-bold">Login Options</div>
                  <div className="mt-1 text-xs text-slate-700">
                    You can sign in using your registered <b>Mobile Number OTP</b> or <b>Google Account</b> directly without typing a password.
                  </div>
                </div>
              </div>

              <p>
                To reset or update account passwords, please contact the <b>S.S Agency Administrator</b> or use the <b>Create/Update Admin Account</b> tool.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-nandini-blue text-white font-semibold rounded-lg text-xs hover:bg-nandini-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
