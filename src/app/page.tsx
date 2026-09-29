'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  X,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  LogIn,
  Phone,
  Lock,
  User,
  Store as StoreIcon,
  RefreshCw,
  Send,
} from 'lucide-react';
import { store } from '@/lib/store';
import { otpService } from '@/lib/authService';

type AuthView = 'LOGIN' | 'REGISTER' | 'OTP_LOGIN';

export default function UnifiedAuthPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AuthView>('LOGIN');

  // Unified Login State
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // OTP Login State
  const [otpMobile, setOtpMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpDebugMessage, setOtpDebugMessage] = useState<string | null>(null);

  // Admin Registration State
  const [regFullName, setRegFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regShopName, setRegShopName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpVerified, setRegOtpVerified] = useState(false);
  const [regCountdown, setRegCountdown] = useState(0);
  const [regDebugOtp, setRegDebugOtp] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [forgotDebugOtp, setForgotDebugOtp] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    let timer: any;
    if (regCountdown > 0) {
      timer = setTimeout(() => setRegCountdown(regCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [regCountdown]);

  useEffect(() => {
    let timer: any;
    if (forgotCountdown > 0) {
      timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotCountdown]);

  // Handle Unified Login (Determines role automatically from backend/store)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoginLoading(true);

    try {
      const res = await store.authenticate(loginInput, loginPassword);
      if (res.success && res.user) {
        if (res.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/delivery-boy');
        }
      } else {
        setAuthError(res.message || 'Invalid username/mobile or password.');
      }
    } catch (err) {
      setAuthError('An unexpected error occurred during login. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Send OTP for Admin Registration
  const handleSendRegOtp = async () => {
    setRegError(null);
    if (!regMobile || regMobile.replace(/\D/g, '').length < 10) {
      setRegError('Please enter a valid 10-digit mobile number first.');
      return;
    }

    const res = await otpService.sendOtp(regMobile, 'Registration');
    if (res.success) {
      setRegOtpSent(true);
      setRegCountdown(60);
      if (res.debugOtp) {
        setRegDebugOtp(res.message || `OTP: ${res.debugOtp}`);
        setRegOtpCode(res.debugOtp);
      }
    } else {
      setRegError(res.message || 'Failed to send OTP.');
    }
  };

  // Handle Verify Registration OTP
  const handleVerifyRegOtp = async () => {
    setRegError(null);
    if (!regOtpCode || regOtpCode.trim().length !== 6) {
      setRegError('Please enter the 6-digit OTP code.');
      return;
    }

    const isMatch = await otpService.verifyOtp(regMobile, regOtpCode);
    if (isMatch) {
      setRegOtpVerified(true);
      setRegError(null);
    } else {
      setRegError('Invalid or expired OTP. Please check and try again.');
    }
  };

  // Handle Admin Registration Form Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regOtpVerified) {
      setRegError('Please verify your mobile number with OTP before completing registration.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Password and confirm password do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    const res = await store.registerAdmin({
      fullName: regFullName,
      mobile: regMobile,
      username: regUsername,
      passwordInput: regPassword,
      shopName: regShopName,
    });

    if (res.success) {
      setRegSuccess('Admin account created successfully! Redirecting to Admin Portal...');
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } else {
      setRegError(res.message || 'Registration failed. Please check your details.');
    }
  };

  // Handle Forgot Password Flow
  const handleSendForgotOtp = async () => {
    setForgotError(null);
    if (!forgotMobile || forgotMobile.replace(/\D/g, '').length < 10) {
      setForgotError('Please enter your registered 10-digit mobile number.');
      return;
    }

    const res = await otpService.sendOtp(forgotMobile, 'Password Reset');
    if (res.success) {
      setForgotOtpSent(true);
      setForgotCountdown(60);
      if (res.debugOtp) {
        setForgotDebugOtp(res.message || `OTP: ${res.debugOtp}`);
        setForgotOtpCode(res.debugOtp);
      }
    } else {
      setForgotError(res.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyForgotOtp = async () => {
    setForgotError(null);
    if (!forgotOtpCode || forgotOtpCode.trim().length !== 6) {
      setForgotError('Please enter the 6-digit OTP code.');
      return;
    }

    const isMatch = await otpService.verifyOtp(forgotMobile, forgotOtpCode);
    if (isMatch) {
      setForgotOtpVerified(true);
      setForgotError(null);
    } else {
      setForgotError('Invalid or expired OTP.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Passwords do not match.');
      return;
    }

    if (forgotNewPass.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    const success = await store.resetPassword(forgotMobile, forgotNewPass);
    if (success) {
      setForgotSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess(null);
        setLoginInput(forgotMobile);
        setLoginPassword('');
      }, 1800);
    } else {
      setForgotError('No account found for this mobile number.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-20 w-44 rounded-2xl bg-white shadow-md p-2 border border-blue-200 mb-3">
          <img src="/logo.png" alt="Nandini S.S Agency Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          NANDINI MILK MANAGEMENT
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
          Door-to-Door Delivery & Multi-Shop Administration System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 shadow-xl border border-slate-200 rounded-3xl sm:px-10 space-y-5">

          {/* Navigation Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setAuthError(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                activeTab === 'LOGIN'
                  ? 'bg-nandini-blue text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setRegError(null);
                setRegSuccess(null);
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                activeTab === 'REGISTER'
                  ? 'bg-nandini-blue text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Admin</span>
            </button>
          </div>

          {/* Error & Success Messages */}
          {authError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* 1. SINGLE UNIFIED LOGIN VIEW (Admin or Delivery Boy) */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username or Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Enter registered username or mobile"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50/50 focus:bg-white"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMobile(loginInput);
                      setForgotOtpSent(false);
                      setForgotOtpVerified(false);
                      setForgotError(null);
                      setForgotSuccess(null);
                      setShowForgotModal(true);
                    }}
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
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nandini-blue bg-slate-50/50 focus:bg-white"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                disabled={loginLoading}
                className="w-full mt-2 bg-nandini-blue hover:bg-blue-800 active:scale-[0.99] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Your Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>Direct portal routing automatically identifies Shop Admin & Delivery Boy accounts.</span>
              </div>
            </form>
          )}

          {/* 2. ADMIN REGISTRATION VIEW WITH OTP VERIFICATION */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {regError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Shop Name (Optional)
                </label>
                <input
                  type="text"
                  value={regShopName}
                  onChange={(e) => setRegShopName(e.target.value)}
                  placeholder="e.g. Nandini Milk Parlour Seegehalli"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              {/* Mobile Number & OTP Verification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mobile Number (10 Digits) *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="tel"
                    required
                    disabled={regOtpVerified}
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none disabled:bg-slate-100"
                  />
                  {!regOtpVerified && (
                    <button
                      type="button"
                      disabled={regCountdown > 0}
                      onClick={handleSendRegOtp}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50"
                    >
                      {regCountdown > 0 ? `Resend (${regCountdown}s)` : regOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                  {regOtpVerified && (
                    <span className="px-3 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>

              {regDebugOtp && !regOtpVerified && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-mono">
                  {regDebugOtp}
                </div>
              )}

              {regOtpSent && !regOtpVerified && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Enter 6-Digit OTP Code *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyRegOtp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Choose Username *
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. seegehalli_admin"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 bg-nandini-blue hover:bg-blue-800 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Independent Admin Shop</span>
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-nandini-blue font-bold text-base">
                <Key className="w-5 h-5" />
                <span>Reset Password with OTP</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs sm:text-sm">
                {forgotError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Registered Mobile Number *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="tel"
                      disabled={forgotOtpVerified}
                      value={forgotMobile}
                      onChange={(e) => setForgotMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none disabled:bg-slate-100"
                    />
                    {!forgotOtpVerified && (
                      <button
                        type="button"
                        disabled={forgotCountdown > 0}
                        onClick={handleSendForgotOtp}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50"
                      >
                        {forgotCountdown > 0 ? `Resend (${forgotCountdown}s)` : forgotOtpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                </div>

                {forgotDebugOtp && !forgotOtpVerified && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-mono">
                    {forgotDebugOtp}
                  </div>
                )}

                {forgotOtpSent && !forgotOtpVerified && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Enter 6-Digit OTP Code *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={forgotOtpCode}
                        onChange={(e) => setForgotOtpCode(e.target.value)}
                        placeholder="123456"
                        className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyForgotOtp}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                )}

                {forgotOtpVerified && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
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
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-nandini-blue focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-nandini-blue hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm"
                    >
                      Update Password & Sign In
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
