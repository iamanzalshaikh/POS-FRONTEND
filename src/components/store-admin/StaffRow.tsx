import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { StaffMember } from '../../pages/store-admin/staff-management/types/staff.types';
import { StaffStatusBadge, RoleBadge } from './StaffStatusBadge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface StaffRowProps {
    member: StaffMember;
    index: number;
    onEdit: (member: StaffMember) => void;
}

export default function StaffRow({ member, index, onEdit }: StaffRowProps) {

    return (
        <tr className="group transition-all duration-300 border-b-2 border-black/95 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
            <td className="px-6 py-3 text-center">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {index.toString().padStart(2, '0')}
                </span>
            </td>
            <td className="px-6 py-3 text-center">
                <div className="flex flex-col items-center">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">{member.name}</p>
                </div>
            </td>
            <td className="px-6 py-3 text-center">
                <div className="text-slate-500 dark:text-slate-400 font-bold text-[10px] lowercase tracking-[0.05em] leading-none">
                    {member.email.toLowerCase()}
                </div>
            </td>
            <td className="px-6 py-3">
                <div className="flex justify-center">
                    <RoleBadge role={member.role} />
                </div>
            </td>
            <td className="px-6 py-3">
                <div className="flex justify-center">
                    <StaffStatusBadge
                        status={member.status}
                    />
                </div>
            </td>
            <td className="px-6 py-3">
                <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">
                        Login: {member.lastLogin || 'Never'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none">
                        Logout: {member.lastLogout || 'Never'}
                    </span>
                </div>
            </td>
            <td className="px-6 py-3">
                <div className="flex items-center justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-12 w-12 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 group/btn">
                                <MoreVertical className="h-6 w-6 text-black dark:text-white group-hover/btn:scale-110 transition-transform" strokeWidth={3} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px] rounded-2xl border-slate-900 dark:border-slate-800 shadow-2xl p-2 bg-white dark:bg-slate-900 ring-1 ring-black/5">
                            <DropdownMenuItem 
                                onClick={() => onEdit(member)}
                                className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Edit2 size={14} className="text-slate-400" />
                                Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer rounded-xl text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10 transition-colors"
                            >
                                <Trash2 size={14} />
                                Terminate User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    );
}
