import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Monitor, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { terminalsApi } from '../../service/api';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AddTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTerminalModal({ isOpen, onClose, onSuccess }: AddTerminalModalProps) {
  const [step, setStep] = useState<'loading' | 'check' | 'already' | 'form' | 'success' | 'error'>('loading');
  const [terminalName, setTerminalName] = useState('');
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [existingName, setExistingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep('loading');
      setError(null);
      setTerminalName('');
      setExistingName('');
      setFingerprint(null);

      const run = async () => {
        try {
          const fp = await getDeviceFingerprint();
          setFingerprint(fp);
          const res = await terminalsApi.check(fp);
          const data = res.data?.data;
          if (data?.registered && data?.terminal) {
            setExistingName(data.terminal.deviceName);
            setStep('already');
          } else {
            setStep('form');
          }
        } catch (err) {
          setStep('error');
          setError((err as any)?.response?.data?.message || 'Failed to sync with device.');
        }
      };
      run();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fingerprint || !terminalName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await terminalsApi.register({
        terminalName: terminalName.trim(),
        deviceFingerprint: fingerprint,
      });
      const data = res.data?.data;
      if (data?.alreadyRegistered) {
        setExistingName(data.terminal?.deviceName || 'Unknown');
        setStep('already');
      } else {
        setStep('success');
        onSuccess();
      }
    } catch (err) {
      setError((err as any)?.response?.data?.message || 'Terminal registration failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden uppercase">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={handleClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-white/5 dark:border-white/10">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Hardware</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Register Device Terminal</p>
          </div>
          <button onClick={handleClose} type="button" className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {step === 'loading' && (
            <div className="py-20 flex flex-col items-center gap-6">
              <div className="relative">
                <Skeleton className="w-20 h-20 rounded-[28px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-slate-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 flex flex-col items-center">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-2 w-32" />
              </div>
            </div>
          )}

          {step === 'already' && (
            <div className="py-10 text-center space-y-8">
              <div className="w-20 h-20 rounded-[28px] bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/50">
                <CheckCircle2 className="w-10 h-10 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Device Linked</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                  Registered Alias: <span className="text-blue-500">{existingName}</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Return to Hub
              </button>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Terminal Alias</label>
                <div className="relative group">
                  <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                  <input
                    required
                    type="text"
                    value={terminalName}
                    onChange={(e) => setTerminalName(e.target.value)}
                    placeholder="e.g. Counter 1"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={handleClose} className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-2 py-4 px-8 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 border border-blue-500">
                  {loading ? 'Processing...' : 'Link Device'}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="py-10 text-center space-y-8">
              <div className="w-20 h-20 rounded-[28px] bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">System Linked</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                  Successfully Authorized as <span className="text-blue-500">{terminalName}</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-700 transition-all"
              >
                Finalize
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="py-10 text-center space-y-8">
              <div className="w-20 h-20 rounded-[28px] bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/50">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Sync Error</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose px-4">{error}</p>
              </div>
              <button onClick={handleClose} className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all">
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
  
