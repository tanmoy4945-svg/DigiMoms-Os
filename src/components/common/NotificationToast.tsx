import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toast } = useSaaS();

  if (!toast) return null;

  const bgColors = {
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
    info: 'bg-sky-950/90 border-sky-500/50 text-sky-200'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-bounce-short">
      <div className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${bgColors[toast.type]}`}>
        {icons[toast.type]}
        <div className="text-sm font-medium leading-snug">{toast.message}</div>
      </div>
    </div>
  );
};
