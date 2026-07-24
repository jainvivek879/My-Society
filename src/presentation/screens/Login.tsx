/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, Lock, Eye, EyeOff, ShieldAlert, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../services/authContext';

interface LoginProps {
  onForgotPasswordClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onForgotPasswordClick }) => {
  const { loginWithEmail, loginWithOTP, loginWithGoogle, error, theme, toggleTheme } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalError('Please enter your registered email address.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'No user account matches this email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = () => {
    if (!phone) {
      setLocalError('Please enter your mobile phone number.');
      return;
    }
    setLocalError(null);
    const mockCode = '123456';
    setGeneratedOtp(mockCode);
    setOtp(mockCode);
    setOtpSent(true);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) {
      setLocalError('Please fill in both phone and OTP fields.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginWithOTP(phone, otp);
    } catch (err: any) {
      setLocalError(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in with Google account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(demoEmail);
    } catch (err: any) {
      setLocalError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden transition-colors duration-300">
      
      {/* Universal Sticky Nav Header */}
      <nav className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between shrink-0 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
              OmniGate
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Smart Housing Society Management
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Toggle Light/Dark Mode"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      {/* Main Fluid Grid Area */}
      <main className="flex-grow flex flex-col lg:flex-row p-6 lg:p-8 gap-6 lg:gap-8 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column: Sign In Box */}
        <section className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 h-full">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 flex flex-col h-full overflow-y-auto transition-colors">
            
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Account Sign In</h1>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Smart Housing Society Management</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Secure access for Residents, Security Guards, Society Staff, Society Administrators and Platform Administrators.</p>
            </div>

            {/* Login Tab Selectors */}
            <div className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl flex gap-1 border border-slate-200/50 dark:border-slate-700/50 mb-6">
              <button
                onClick={() => { setLoginMethod('email'); setLocalError(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginMethod === 'email'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                onClick={() => { setLoginMethod('phone'); setLocalError(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginMethod === 'phone'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> Mobile OTP
              </button>
            </div>

            {/* Error Message Section */}
            <AnimatePresence mode="wait">
              {(localError || error) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 mb-6"
                >
                  <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300">Sign In Error</p>
                    <p className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed whitespace-pre-line">{localError || error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Method Form */}
            <div className="space-y-4 mb-6">
              {loginMethod === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        placeholder="your-name@society.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={onForgotPasswordClick}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Authenticating...' : 'Sign In'} <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-3.5 text-slate-400 font-semibold text-sm">+91</span>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-14 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {otpSent ? 'Resend' : 'Send Code'}
                      </button>
                    </div>
                  </div>

                  {/* OTP Input */}
                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Code (OTP)</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting || !otpSent}
                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Verify OTP & Enter'} <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Social Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest text-[10px]">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth & Quick Demo Roles */}
            <div className="space-y-4 mb-auto">
              <button
                onClick={handleGoogleSubmit}
                disabled={submitting}
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold font-sans">G</div>
                Sign in with Google
              </button>

              {/* 1-Click Demo Login Roles */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  <span>Instant Demo Role Switcher</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-sans">1-Click Access</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('superadmin@omnigate.com')}
                    disabled={submitting}
                    className="p-2 bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl transition-all cursor-pointer text-left group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center gap-1 truncate">
                      👑 Super Admin
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">Global Platform</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin@greenwood.com')}
                    disabled={submitting}
                    className="p-2 bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl transition-all cursor-pointer text-left group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center gap-1 truncate">
                      🏢 Society Admin
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">Gokuldham Manager</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('semi.jain@gmail.com')}
                    disabled={submitting}
                    className="p-2 bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl transition-all cursor-pointer text-left group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center gap-1 truncate">
                      🛡️ Security Guard
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">Gate Terminal</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('jain.vivek879@gmail.com')}
                    disabled={submitting}
                    className="p-2 bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl transition-all cursor-pointer text-left group"
                  >
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center gap-1 truncate">
                      🏠 Resident
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">Vivek Jain (B-504)</div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('staff@greenwood.com')}
                  disabled={submitting}
                  className="w-full p-2 bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl transition-all cursor-pointer text-left group flex items-center justify-between"
                >
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 flex items-center gap-1">
                    🛠️ Society Staff Member
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">Suresh (Electrician)</div>
                </button>
              </div>
            </div>

            {/* Platform Policy Footer */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center mt-6">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                By continuing, you agree to the Multi-tenant License Agreement and Privacy Policy.
              </p>
            </div>

          </div>
        </section>

        {/* Right Column: Society Hero Showcase & Platform Highlights */}
        <section className="flex-grow flex flex-col gap-6 overflow-y-auto lg:overflow-hidden h-full">
          
          {/* Main Hero Card with High Quality Society Image */}
          <div className="relative rounded-2xl overflow-hidden flex-grow border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-end p-8 min-h-[380px]">
            {/* Background Image */}
            <img 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80" 
              alt="OmniGate Premium Gated Society"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            {/* Content Overlay */}
            <div className="relative z-10 space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Next-Gen Gated Community Management</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Smart. Secure. Connected Communities.
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Manage visitors, residents, security staff, maintenance, notices, deliveries and daily society operations from one secure cloud platform.
              </p>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 font-bold text-sm">
                🛡️
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gate & Visitor Pass</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time gate logging, pre-approved guest passes, and instant resident notifications.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 font-bold text-sm">
                🏢
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Society Admin Hub</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Automated maintenance invoices, digital notice board, and flat directory.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2 font-bold text-sm">
                ⚡
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Cloud Sync</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Instant updates across mobile app and gate security consoles with zero delay.</p>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
};
