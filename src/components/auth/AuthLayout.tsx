import React from 'react';
import { Layers } from 'lucide-react';
import { APP_CONFIG } from '../../config/version';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  maxWidth = 'md',
}) => {
  const containerWidthClass = {
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl lg:max-w-3xl',
  }[maxWidth];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/30 flex flex-col justify-center py-10 sm:px-6 lg:px-8 antialiased">
      <div className={`sm:mx-auto sm:w-full ${containerWidthClass} text-center`}>
        {/* Brand */}
        <div className="inline-flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-bold text-slate-800 text-2xl tracking-tight">
            Nexus<span className="text-indigo-600">CRM</span>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">{title}</h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{subtitle}</p>
      </div>

      <div className={`mt-6 sm:mx-auto sm:w-full ${containerWidthClass} px-4 sm:px-0`}>
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {children}
        </div>

        {/* System Version Footer below the main card */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            {APP_CONFIG.name} • Versão {APP_CONFIG.version}
          </p>
        </div>
      </div>
    </div>
  );
};
