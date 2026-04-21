import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <Trash2 className="w-10 h-10 text-rose-500" />,
      iconBg: 'bg-rose-50 dark:bg-rose-950/30',
      iconBorder: 'border-rose-100 dark:border-rose-900/50',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
      buttonBorder: 'border-rose-500'
    },
    warning: {
      icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
      iconBorder: 'border-amber-100 dark:border-amber-900/50',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
      buttonBorder: 'border-amber-500'
    },
    info: {
      icon: <AlertTriangle className="w-10 h-10 text-blue-500" />,
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconBorder: 'border-blue-100 dark:border-blue-900/50',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
      buttonBorder: 'border-blue-500'
    }
  };

  const config = typeConfig[type];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/5 dark:border-white/10">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{title}</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Confirmation Required</p>
          </div>
          <button onClick={onClose} type="button" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className={`shrink-0 w-16 h-16 rounded-[22px] ${config.iconBg} flex items-center justify-center border ${config.iconBorder}`}>
            {React.cloneElement(config.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            disabled={isLoading}
            className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-50 border ${config.buttonBg} ${config.buttonBorder}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
