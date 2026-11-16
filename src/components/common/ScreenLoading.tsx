import React from 'react';
import { Loader2 } from 'lucide-react';

interface ScreenLoadingProps {
  title?: string;
  subtitle?: string;
}

export const ScreenLoading: React.FC<ScreenLoadingProps> = ({
  title = 'Carregando dados...',
  subtitle = 'Aguarde um momento enquanto preparamos as informações da tela.',
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 sm:p-20 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px] transition-all duration-200">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-sky-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-600 border-2 border-white"></span>
        </span>
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
