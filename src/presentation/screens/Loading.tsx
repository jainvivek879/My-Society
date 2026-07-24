/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="space-y-4 text-center">
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Accessing Secure Vault
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            Verifying Multi-Tenant Boundaries...
          </p>
        </div>
      </div>
    </div>
  );
};
