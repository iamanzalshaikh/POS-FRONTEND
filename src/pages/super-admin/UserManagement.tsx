import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Shield, AlertCircle } from 'lucide-react';
import { usersApi } from '../../service/api';
import { StatsCard } from '../../components/ui/StatsCard';
import { DataTable } from '@/components/global-components/data-table';
import type { ColumnDef } from '@tanstack/react-table';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();

  // 1. Data Fetching
  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['superadmin-users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data?.data || [];
    }
  });

  const users = usersRes || [];

  // 2. Stats
  const totalAdmins = users.length;
  const storeAdmins = users.filter((u: any) => u.role === 'STORE_ADMIN').length;
  const activeAdmins = users.filter((u: any) => u.isActive).length;

  // 3. Columns Definition
  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "index",
      header: "Admin ID",
      cell: ({ row }) => <span className="font-mono text-[11px] text-slate-300 font-medium tracking-tighter">{(row.index + 1).toString().padStart(4, '0')}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Admin Name',
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-900 dark:text-white leading-tight">{row.original.name}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'storeId',
      header: 'Store Node',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <div className="flex justify-center">
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[10px] rounded-lg px-4 py-1.5 min-w-[80px]">
              {val ? `STR-${val.slice(-4).toUpperCase()}` : 'GLOBAL'}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'role',
      header: 'Clearance',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500 font-medium">
          {(getValue() as string).replace('_', ' ')}
        </span>
      )
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const active = getValue() as boolean;
        return (
          <div className="flex justify-center">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${active ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
              {active ? 'Active' : 'Inactive'}
            </div>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-3 px-2">
          <button
            onClick={() => navigate(`/super-admin/admins/edit/${row.original.id}`)}
            className="text-slate-300 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
          <button
            onClick={() => navigate(`/super-admin/admins/edit/${row.original.id}`)}
            className="text-slate-300 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        </div>
      ),
    },
  ], [navigate]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            Network Administrators
          </h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">
            Manage global platform access and administrative permissions
          </p>
        </div>
        <button
          onClick={() => navigate('/super-admin/admins/create')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          <UserPlus size={16} />
          Provision Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Stakeholders"
          value={totalAdmins}
          icon={Users}
          trend={{ value: "+12%", label: "from last month", isPositive: true }}
        />
        <StatsCard
          title="Active Sessions"
          value={activeAdmins}
          icon={Shield}
          description="Normal throughput"
        />
        <StatsCard
          title="Store Operators"
          value={storeAdmins}
          icon={AlertCircle}
          description="Verified nodes"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Administrative Directory</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global platform user registry</p>
          </div>
        </div>

        <div className="p-6">
          <DataTable
            columns={columns}
            data={users.filter((u: any) => u.role !== 'SUPER_ADMIN')}
            isLoading={isLoading}
            searchKey="name"
            placeholder="Search by name or email..."
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagement;