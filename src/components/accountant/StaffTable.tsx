import React from 'react';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { StaffMember } from '../../api/staff.api';

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (staff: StaffMember) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  loading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatRole = (role: string) => {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const StaffTable: React.FC<StaffTableProps> = ({
  staff,
  onEdit,
  onDelete,
  deleteConfirmId,
  setDeleteConfirmId,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-12 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
              <div className="h-4 bg-slate-200 rounded w-1/5"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No staff found</h3>
          <p className="text-sm text-slate-500 text-center">
            Get started by adding your first staff member
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                Name
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                Role
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                Monthly Salary
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                Joining Date
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{member.name}</div>
                      {member.phone && (
                        <div className="text-[10px] text-slate-500">{member.phone}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {formatRole(member.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(Number(member.monthlySalary))}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {member.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-700">
                    {formatDate(member.joiningDate)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(member)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    {deleteConfirmId === member.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDelete(member.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                        >
                          <AlertTriangle size={12} />
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(member.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
