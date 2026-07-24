/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../services/authContext';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalError('Please enter your registered email address.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setLocalError(err?.message || 'No account found associated with this email address.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-100 dark:shadow-none space-y-6">
        
        {/* Back Link */}
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        {submitted ? (
          /* Success Message */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-4"
          >
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/40 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                Recovery Link Dispatched
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                We have sent secure reset instructions to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
              </p>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Simulated SMTP Relay Success • Phase 1
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full mt-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-3 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          </motion.div>
        ) : (
          /* Reset Form */
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-sans font-bold text-slate-950 dark:text-white">
                Retrieve Credentials
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Provide your email address to receive password recovery protocols.
              </p>
            </div>

            {localError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-800 dark:text-red-300">
                    Recovery Error
                  </p>
                  <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                    {localError}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    placeholder="your-name@society.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl py-3.5 font-bold text-sm transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Verifying Identity...' : 'Dispatch Reset Email'} <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
