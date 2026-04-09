import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  const styles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      iconBg: 'bg-rose-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      iconBg: 'bg-blue-500',
    },
  };

  return (
    <div
      className={`${styles[type].bg} ${styles[type].border} border rounded-2xl p-4 flex items-center gap-3 shadow-lg animate-slide-in-right min-w-[320px] max-w-md`}
    >
      <div className={`${styles[type].iconBg} text-white rounded-full p-2 flex-shrink-0`}>
        {icons[type]}
      </div>
      <p className={`text-sm font-bold ${styles[type].text} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
