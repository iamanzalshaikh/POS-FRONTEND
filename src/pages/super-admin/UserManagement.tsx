import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Shield, AlertCircle, Eye, Edit2 } from 'lucide-react';
import { usersApi } from '../../service/api';
import { DataTable } from '@/components/global-components/data-table';
import PageHeader from '@/components/global-components/PageHeader';
import MetricCard from '@/components/global-components/MetricCard';
import type { ColumnDef } from '@tanstack/react-table';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [usersRes, setUsersRes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll();
      setUsersRes(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
      header: 'Admin',
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-900 dark:text-white leading-tight">{row.original.name}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'storeId',
      header: 'Store',
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
      header: 'Role',
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
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/super-admin/admins/edit/${row.original.id}`)}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => navigate(`/super-admin/admins/edit/${row.original.id}`)}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
            title="Edit Admin"
          >
            <Edit2 size={16} />
          </button>
        </div>
      ),
    },
  ], [navigate]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="Administrators"
        description="Manage system users and their permissions"
        icon={Users}
        primaryAction={{
            label: "Create Admin",
            onClick: () => navigate('/super-admin/admins/create'),
            icon: UserPlus
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Admins"
          value={totalAdmins}
          icon={Users}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
        <MetricCard
          title="Active Now"
          value={activeAdmins}
          icon={Shield}
          subtitle="Users currently online"
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Store Admins"
          value={storeAdmins}
          icon={AlertCircle}
          subtitle="Admins linked to stores"
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">User List</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Directory of all admin users</p>
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