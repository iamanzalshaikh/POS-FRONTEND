import { Users } from 'lucide-react';
import StaffRow from './StaffRow';
import type { StaffMember } from '../../pages/store-admin/staff-management/types/staff.types';

interface StaffTableProps {
    staff: StaffMember[];
    onEdit: (member: StaffMember) => void;
}

export default function StaffTable({ staff, onEdit }: StaffTableProps) {
    return (
        <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white dark:bg-slate-900 border-t-4 border-black">
                        <tr className="border-b-4 border-black">
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center">ID</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center">Name</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center">Email Address</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center">Role</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center">Status</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center">Login / Logout</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center text-indigo-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {staff.map((member, idx) => (
                            <StaffRow
                                key={member.id}
                                member={member}
                                index={idx + 1}
                                onEdit={onEdit}
                            />
                        ))}
                        {staff.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[20px] flex items-center justify-center text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-slate-700">
                                            <Users size={32} />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 dark:text-white font-bold text-sm tracking-tight leading-none mb-1">No Staff Members Found</p>
                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Try adjusting your filters or contact administrator</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
    );
}
