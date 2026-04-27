//import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getStaffById, 
  getPayroll, 
  //deleteStaff as deleteStaffApi,
  fetchStaffMemberById 
} from "@/api/staff.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
//import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Calendar, 
  //Users, 
  Activity, 
  //Trash2, 
  Mail, 
  ChevronRight,
  Phone, 
  BadgeCheck, 
  User as UserIcon,
  Cake,
  MapPin,
  Briefcase,
  ExternalLink,
  ArrowLeft,
  FileText,
  ShieldCheck,
  //Heart
} from "lucide-react";
import { formatAmount, formatDate } from "@/utils/format";
import { StaffDetailSkeleton } from "@/components/ui/skeletons/StaffDetailSkeleton";
//import { toast } from "@/lib/toast";

const getMonthYearString = (year: number, month: number) => {
  const date = new Date(year, month - 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const { data: staffRes, isLoading: staffLoading } = useQuery({
    queryKey: ['accountant-staff-basic', id],
    queryFn: () => getStaffById(id!),
    enabled: !!id,
  });

  const { data: payrollRes, isLoading: payrollLoading } = useQuery({
    queryKey: ['accountant-staff-ledger', id],
    queryFn: () => getPayroll({ staffId: id! }),
    enabled: !!id,
  });

  const { data: authRes } = useQuery({
    queryKey: ['accountant-staff-auth', id],
    queryFn: () => fetchStaffMemberById(id!),
    enabled: !!id,
  });

  const staff = staffRes?.success ? staffRes.data[0] : null;
  const history = payrollRes?.success ? payrollRes.data.items : [];
  const authData = authRes?.data;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const statusLabel = (s: string) =>
    s === "ACTIVE" ? "Active" : s === "ON_LEAVE" ? "On Leave" : s === "INACTIVE" ? "Inactive" : s;

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20 border-emerald-500/20';
      case 'ON_LEAVE': return 'bg-blue-500/10 text-blue-500 ring-blue-500/20 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 ring-slate-500/20 border-slate-500/20';
    }
  };

  if (staffLoading || payrollLoading) return <div className="p-8"><StaffDetailSkeleton /></div>;

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
        <UserIcon className="size-16 text-slate-200 mb-6" />
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Registry Entry Not Found</h2>
        <Button onClick={() => navigate('/accountant/staff')} className="mt-8 rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest">Return to list</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Portrait</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-500" />
            Personnel Identity & Financial Registry
          </p>
        </div>
        <Button
          onClick={() => navigate("/accountant/staff")}
          variant="outline"
          className="rounded-2xl border-slate-200 dark:border-slate-800 h-12 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Directory
        </Button>
      </div>

      {/* Profile Overview Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Vital Statistics Card */}
        <div className="lg:col-span-1">
          <div className="group relative rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all duration-300">
            {/* Avatar Cluster */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-6">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-3xl font-black shadow-2xl shadow-indigo-500/20 ring-8 ring-indigo-50 dark:ring-indigo-950/20">
                  {getInitials(staff.name)}
                </div>
                <div className={`absolute -bottom-1 -right-1 size-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center ${staff.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                  {staff.status === 'ACTIVE' ? <Activity size={14} className="text-white" /> : <ChevronRight size={14} className="text-white" />}
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {staff.name}
                </h2>
                {staff.fatherHusbandName && (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1 italic opacity-80">PATERNAL: {staff.fatherHusbandName}</p>
                )}
                <div className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${getStatusBadgeClass(staff.status)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${staff.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {statusLabel(staff.status)}
                </div>
              </div>
            </div>

            {/* Formal Quick List */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                  <BadgeCheck size={20} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entity Tag</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{staff.displayId || `#${staff.id.slice(-6).toUpperCase()}`}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                  <Briefcase size={20} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Professional Identity</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{staff.role.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                  <Calendar size={20} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Induction Date</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{formatDate(staff.joiningDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/30 transition-colors">
                <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                  <Wallet size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Agreed Compensation</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{formatAmount(staff.monthlySalary)} / MO</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Nexus Grid */}
        <div className="lg:col-span-2">
          <div className="rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-widest">Detailed Identity Matrix</h3>
              <ExternalLink size={20} className="text-slate-200" />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Contact Data */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="size-4 text-indigo-500" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Registry</p>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">{staff.email || 'NO EMAIL REGISTERED'}</p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <Phone className="size-4 text-emerald-500" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Secure Line</p>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{staff.phone || 'NO PHONE REGISTERED'}</p>
              </div>

              {/* Bio Data */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="size-4 text-indigo-500" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Civil Identification</p>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{staff.cnic || 'NOT COLLECTED'}</p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <Cake className="size-4 text-indigo-500" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Birth Anniversary</p>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{staff.dateOfBirth ? formatDate(staff.dateOfBirth) : 'NOT RECORDED'}</p>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="size-4 text-indigo-500" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Primary Residence</p>
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-relaxed">{staff.address || 'RESIDENCE DATA PENDING'}</p>
              </div>

              {/* Advanced Access Data */}
              <div className="sm:col-span-2 p-6 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100/30 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="size-4 text-indigo-600" />
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">System Access Credentials</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Terminal Auth Type</p>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Cloud Secure (Biometric/Pass)</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Last Access Hub</p>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{authData?.assignedTerminals?.[0]?.deviceName || 'MAIN OFFICE PORTAL'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Statistics Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between shadow-none bg-emerald-50/10">
          <div>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Net Salary</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{formatAmount(staff.monthlySalary)}</p>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
            <Wallet size={20} />
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between shadow-none bg-indigo-50/10">
          <div>
            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">Induction Date</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter text-lg">{new Date(staff.joiningDate).getFullYear()}</p>
          </div>
          <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/10">
            <Calendar size={20} />
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between shadow-none">
          <div>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Registry Role</p>
            <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{staff.role.split('_')[0]}</p>
          </div>
          <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/10">
            <ShieldCheck size={20} />
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between shadow-none bg-amber-50/10">
          <div>
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Active State</p>
            <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{statusLabel(staff.status)}</p>
          </div>
          <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/10">
            <Activity size={20} />
          </div>
        </Card>
      </div>

      {/* History Ledger */}
      <div className="rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 shadow-none overflow-hidden">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-[3px]">
          <span className="size-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Institutional Financial Registry
        </h3>
        
        <div className="overflow-x-auto -mx-10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                <th className="px-10 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest w-16">Seq.</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Month</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Base Salary</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Bonus</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Deductions</th>
                <th className="px-10 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Total Paid</th>
                <th className="px-10 py-5 text-right text-[9px] font-black uppercase text-slate-400 tracking-widest">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {history.length > 0 ? (
                history.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-10 py-6 whitespace-nowrap">
                      <span className="text-[10px] font-black text-slate-400 tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-10 py-6 whitespace-nowrap">
                      <div className="inline-flex items-center rounded-2xl px-4 py-1.5 text-[10px] font-black bg-indigo-500/10 text-indigo-600 border border-indigo-500/10 uppercase tracking-widest">
                        {getMonthYearString(record.year, record.month)}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center tabular-nums">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatAmount(record.baseSalary)}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center tabular-nums">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {formatAmount(record.bonus || 0)}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center tabular-nums">
                      <span className="text-sm font-black text-rose-500">
                        {record.deductions > 0 ? `-${formatAmount(record.deductions)}` : '0.00'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center tabular-nums">
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        {formatAmount(record.amountPaid)}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/accountant/payroll/receipt/${record.id}`)}
                        className="rounded-2xl border-slate-200 h-10 px-6 text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                      >
                        <FileText size={14} className="mr-2" />
                        Slip
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-10 py-16 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No historical disbursements discovered in registry</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
