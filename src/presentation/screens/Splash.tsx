/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Server, KeyRound, Building2 } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-between p-8 transition-colors duration-300">
      {/* Top spacer */}
      <div></div>

      {/* Main Branding Section */}
      <div className="flex flex-col items-center max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6"
        >
          <div className="w-10 h-10 border-[3px] border-white rounded-md rotate-45"></div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-sans font-bold tracking-tight text-slate-950 dark:text-white"
        >
          OmniGate
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-2 text-indigo-600 dark:text-indigo-400 font-sans text-sm font-semibold max-w-xs"
        >
          Smart Housing Society Management
        </motion.p>

        {/* Feature badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
            <ShieldCheck className="w-3.5 h-3.5" /> Multi-Tenant
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
            <KeyRound className="w-3.5 h-3.5" /> RBAC
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            <Server className="w-3.5 h-3.5" /> Firebase Cloud
          </span>
        </motion.div>
      </div>

      {/* Footer Meta Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></div>
          <span className="text-xs font-sans font-medium text-slate-400 dark:text-slate-500 tracking-wider">
            Smart Housing Society Management
          </span>
        </div>
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
          Ready for Web, Mobile & Gate Security Consoles
        </p>
      </motion.div>
    </div>
  );
};
