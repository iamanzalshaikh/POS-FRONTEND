import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPKR } from '@/utils/format';
import { DataTable } from '@/components/global-components/data-table';

const paymentHistory = [
    { id: 'TXN-GLOBAL-001', date: '2024-03-15', displayDate: 'March 15, 2024', amount: 12450, status: 'Settled', method: 'Stripe' },
    { id: 'TXN-GLOBAL-002', date: '2024-02-15', displayDate: 'February 15, 2024', amount: 11920, status: 'Settled', method: 'Stripe' },
    { id: 'TXN-GLOBAL-003', date: '2024-01-15', displayDate: 'January 15, 2024', amount: 10210, status: 'Failed', method: 'PayPal' },
    { id: 'TXN-GLOBAL-004', date: '2024-04-05', displayDate: 'April 05, 2024', amount: 13200, status: 'Pending', method: 'Stripe' },
];

const statusOptions = ['All', 'Settled', 'Pending', 'Failed'];

const SuperAdminPaymentHistoryPage = () => {
    const [statusFilter, setStatusFilter] = useState('All');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const filteredHistory = useMemo(() => {
        return paymentHistory.filter((row) => {
            if (statusFilter !== 'All' && row.status !== statusFilter) {
                return false;
            }

            const rowDate = new Date(row.date);
            if (fromDate && rowDate < new Date(fromDate)) {
                return false;
            }
            if (toDate && rowDate > new Date(toDate)) {
                return false;
            }

            return true;
        });
    }, [statusFilter, fromDate, toDate]);

    const historyColumns = useMemo<ColumnDef<any, any>[]>(() => [
        {
            accessorKey: 'id',
            header: 'Transaction ID',
            cell: ({ getValue }) => <span className="font-mono text-slate-900 text-sm">{getValue<string>()}</span>,
        },
        {
            accessorKey: 'displayDate',
            header: 'Date',
            cell: ({ getValue }) => <span className="text-sm font-semibold text-slate-600">{getValue<string>()}</span>,
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ getValue }) => <span className="text-sm font-black text-slate-900">{formatPKR(getValue<number>())}</span>,
        },
        {
            accessorKey: 'method',
            header: 'Payment Method',
            cell: ({ getValue }) => <span className="text-sm font-semibold text-slate-700">{getValue<string>()}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ getValue }) => {
                const status = getValue<string>();
                return (
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        status === 'Settled' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                        {status}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: () => (
                <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all shadow-sm active:scale-95">
                    <Download size={18} />
                </button>
            ),
        },
    ], []);

    return (
        <div className="animate-fade-in space-y-8 text-slate-900">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment History Page</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">View all past transactions and filter by date or status.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="bg-white border border-slate-100 rounded-3xl px-4 py-3 shadow-sm">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="w-full mt-2 bg-transparent text-sm font-black text-slate-900 focus:outline-none"
                        >
                            {statusOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-3xl px-4 py-3 shadow-sm">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(event) => setFromDate(event.target.value)}
                            className="w-full mt-2 bg-transparent text-sm font-black text-slate-900 focus:outline-none"
                        />
                    </div>
                    <div className="bg-white border border-slate-100 rounded-3xl px-4 py-3 shadow-sm">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">To</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(event) => setToDate(event.target.value)}
                            className="w-full mt-2 bg-transparent text-sm font-black text-slate-900 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
            data={filteredHistory}
            columns={historyColumns}
            showToolbar={false}
            showExport={false}
            showColumns={false}
        />
    </div>
        </div>
    );
};

export default SuperAdminPaymentHistoryPage;