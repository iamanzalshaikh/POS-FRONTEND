import React, { useEffect, useState } from 'react';
import { FileText, Clock, User, X, AlertCircle, Lock } from 'lucide-react';
import { getExpenseAuditLogs, type AuditLog } from '../../api/auditLog.api';
import { formatDate } from '../../utils/expense-utils';

interface ExpenseAuditLogProps {
  expenseId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ExpenseAuditLog: React.FC<ExpenseAuditLogProps> = ({ expenseId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen, expenseId]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getExpenseAuditLogs({ limit: 50 });
      // Filter by expenseId if provided
      const filtered = expenseId 
        ? response.logs.filter(log => log.entityId === expenseId)
        : response.logs;
      setLogs(filtered);
    } catch (err: any) {
      // Silently handle permission errors - show UI message instead
      if (err.response?.status === 403) {
        setError('Access denied. Audit logs are only visible to Store Admin and Super Admin.');
      } else {
        setError('Failed to load audit logs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'ADJUST_STOCK': 'Stock Adjustment',
      'CREATE_EXPENSE': 'Expense Created',
      'UPDATE_EXPENSE': 'Expense Updated',
      'DELETE_EXPENSE': 'Expense Deleted',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string): string => {
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-amber-500" />
              Expense Audit Trail
            </h2>
            <p className="text-sm text-slate-500 mt-1">Complete history of all expense actions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h3>
              <p className="text-sm text-slate-500 max-w-md">{error}</p>
              <p className="text-xs text-slate-400 mt-4">Please contact your Store Admin or Super Admin to view audit logs.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-sm font-bold text-slate-500">Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Audit Logs Found</h3>
              <p className="text-sm text-slate-500">No audit trail available for expenses.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border ${getActionColor(log.action)} transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-white/50 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black uppercase tracking-wider">
                            {getActionLabel(log.action)}
                          </span>
                          {log.entityId && (
                            <span className="text-[10px] font-mono text-slate-500">
                              #{log.entityId.slice(-6).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs space-y-1">
                          {log.user && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{log.user.name || log.user.email}</span>
                            </div>
                          )}
                          <div className="text-slate-500">
                            {formatDate(log.createdAt)}
                          </div>
                          {log.metadata && (
                            <div className="mt-2 p-2 bg-white/50 rounded-lg">
                              <pre className="text-[10px] font-mono whitespace-pre-wrap">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseAuditLog;
