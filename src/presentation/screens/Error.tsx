/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
  onLogout?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry, onLogout }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6">
        
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/30">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
            Security Block / System Exception
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/80 max-h-36 overflow-y-auto">
            {message || 'A critical security or isolation error occurred. Action terminated due to safety parameters.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl py-3 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Retry Connection
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl py-3 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Reset Sign In
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
          System Guard: Multi-Tenant Boundary Preserved
        </p>
      </div>
    </div>
  );
};
