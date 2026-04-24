import React, { useState, useMemo, useEffect } from 'react';
import { Download, Search, AlertCircle, Eye } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MonthlyActivityChart from "@/components/global-components/monthly-activity-chart";
import SalesSummaryCards from "@/components/store-admin/SalesHistory/SalesSummaryCards";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { formatCurrency, formatAmount, toLocalYMD, formatInvoiceNumber } from "@/utils/format";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { useDebounce } from '@/hooks';

import { getDashboardSummary } from "@/api/dashboard.api";
import { getSalesTransactions, cancelSale } from "@/api/sales.api";
import { getSaleGrandTotal } from "@/utils/saleAmounts";

const SalesHistoryPage = () => {
    const navigate = useNavigate();
    // Filters state
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter] = useState("All Status");
    const [paymentMethod] = useState("All Methods");
    const [dateRange, setDateRange] = useState({
        start: toLocalYMD(new Date(new Date().setDate(new Date().getDate() - 30))),
        end: toLocalYMD(new Date())
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Reset to page 1 on filter change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, dateRange, statusFilter, paymentMethod]);

    const params: any = useMemo(() => ({
        startDate: dateRange.start,
        endDate: dateRange.end,
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'All Status' && { paymentStatus: statusFilter }),
        ...(paymentMethod !== 'All Methods' && { paymentMethod: paymentMethod })
    }), [dateRange, page, limit, debouncedSearch, statusFilter, paymentMethod]);

    // Queries
    const { 
        data: salesDataRes, 
        isLoading: salesLoading, 
        refetch: refetchSales 
    } = useQuery({
        queryKey: ['sales-transactions', params],
        queryFn: () => getSalesTransactions(params),
        staleTime: 1000 * 60 * 5,
    });

    const { 
        data: dashboardDataRes, 
        isLoading: summaryLoading 
    } = useQuery({
        queryKey: ['dashboard-summary-sales', dateRange],
        queryFn: () => getDashboardSummary({
            startDate: dateRange.start,
            endDate: dateRange.end
        }),
        staleTime: 1000 * 60 * 10,
    });

    const rawResponseData = salesDataRes?.data;
    const transactions = Array.isArray(rawResponseData) ? rawResponseData : (rawResponseData?.data || []);
    const total = rawResponseData?.total || transactions.length;

    const reportData = dashboardDataRes?.data || dashboardDataRes;

    // Use server-side aggregated metrics instead of local paginated calculation
    const summary = useMemo(() => {
        const s = reportData?.summary;
        return {
            revenue: Number(s?.totalRevenue ?? 0),
            salesCount: Number(s?.totalTransactions ?? 0),
            discount: Number(s?.totalDiscount ?? 0),
            refunds: Number(s?.totalRefunds ?? 0)
        };
    }, [reportData]);

    // Generate full timeline for the chart (fills missing dates with 0)
    const chartsData = useMemo(() => {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const points: any[] = [];
        
        const rawByDate = reportData?.charts?.revenueByDate || [];
        
        let curr = new Date(start);
        while (curr <= end) {
            const dStr = curr.toISOString().split('T')[0];
            const found = rawByDate.find((d: any) => d.date === dStr);
            
            points.push({
                month: curr.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                dateStr: dStr,
                activity: Number(found?.revenue || 0)
            });
            curr.setDate(curr.getDate() + 1);
        }
        return points;
    }, [reportData, dateRange]);


    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            id: "rowNumber",
            header: "ID",
            cell: ({ row }) => (
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                    {String(row.index + 1).padStart(2, '0')}
                </div>
            )
        },
        {
            header: "Invoice",
            accessorKey: "invoiceNumber",
            meta: { align: 'left' },
            cell: ({ row }) => {
                const inv = formatInvoiceNumber(row.original.invoiceNumber || row.original.id);
                const isSpecial = inv.startsWith('REF') || inv.startsWith('OFF');
                return (
                    <div className="min-w-[100px]">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {isSpecial ? inv : `#${inv}`}
                        </p>
                    </div>
                );
            }
        },
        {
            id: "saleDate",
            header: "Date",
            accessorKey: "createdAt",
            cell: ({ row }) => (
                <div className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest tabular-nums leading-none">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </div>
            )
        },
        {
            id: "saleTime",
            header: "Time",
            accessorKey: "createdAt",
            cell: ({ row }) => (
                <div className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest tabular-nums leading-none">
                    {new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            )
        },
        {
            header: "Customer",
            accessorKey: "customerName",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-900 dark:text-white block">{row.original.customerName || 'Walk-in'}</span>
                    <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 mt-0.5 block">Tier: Standard</span>
                </div>
            )
        },
        {
            header: "Total",
            accessorKey: "totalAmount",
            meta: { align: 'right' },
            cell: ({ row }) => {
                const t = row.original;
                const grand = getSaleGrandTotal(t);
                const tax = Number(t.totalTax ?? 0);
                return (
                <div className="text-right">
                    <span className="text-[12px] font-black uppercase tracking-widest tabular-nums text-slate-900 dark:text-white block">
                        {formatAmount(grand)}
                    </span>
                    {Math.abs(tax) > 0 && (
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">GST {formatAmount(tax)}</span>
                    )}
                </div>
                );
            }
        },
        {
            header: "Payment",
            accessorKey: "paymentMethod",
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-[2px] border border-blue-100 dark:border-blue-900/50">
                        {row.original.paymentMethod}
                    </span>
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "paymentStatus",
            cell: ({ row }) => {
                const s = String(row.original.paymentStatus).toLowerCase();
                const isRef = row.original.isReversal || s === 'refunded';
                return (
                    <div className="flex justify-center">
                        <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] border leading-tight",
                            isRef ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" :
                            s === 'completed' || s === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" :
                            s === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
                            "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
                        )}>
                            {isRef ? 'REFUNDED' : s}
                        </span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center items-center gap-2">
                    <button 
                        onClick={() => navigate(`/cashier/receipt/${row.original.id}`)}
                        className="p-2.5 text-slate-300 dark:text-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all active:scale-90 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50 shadow-sm"
                        title="View Receipt"
                    >
                        <Eye size={16} />
                    </button>
                    <button 
                        onClick={() => {
                            if (window.confirm("Cancel this sale?")) {
                                cancelSale(row.original.id, "Cancelled by admin").then(() => refetchSales());
                            }
                        }}
                        className="p-2.5 text-slate-300 dark:text-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 shadow-sm"
                        title="Cancel Sale"
                    >
                        <AlertCircle size={16} />
                    </button>
                </div>
            )
        }
    ], [refetchSales]);

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sales History</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Manage and track all transaction logs</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-[#1E1B4B]/20 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1E1B4B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm">
                        <Download size={16} className="text-[#1E1B4B] dark:text-slate-300" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats & Charts Summary */}
            <div className="space-y-8">
                <SalesSummaryCards data={summary} loading={summaryLoading} />

                {/* Revenue Trend Chart - Synchronized with Dashboard */}
                <MonthlyActivityChart
                    title="Revenue Trend"
                    subtitle="Daily sales performance for selected period"
                    data={chartsData}
                    isLoading={summaryLoading}
                    isCurrency={true}
                    unit="PKR"
                    height={300}
                />
            </div>

            {/* Detailed Ledger Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
                {salesLoading && transactions.length === 0 ? (
                    <TableSkeleton columns={9} rows={limit} />
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={transactions}
                        isLoading={salesLoading}
                        onRefresh={() => refetchSales()}
                        manualPagination={true}
                        hidePagination={false}
                        pageIndex={page}
                        pageSize={limit}
                        pageCount={Math.ceil(total / limit)}
                        totalItems={total}
                        onPageChange={(newPageIndex) => setPage(newPageIndex)}
                        placeholder="Search ledger..."
                        headerActions={
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
                                <div className="relative group w-full lg:w-auto">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search invoice, client..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-full lg:w-[240px]"
                                    />
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                                        {[
                                            { label: 'Today', range: 0 },
                                            { label: 'Weekly', range: 7 },
                                            { label: 'Monthly', range: 30 }
                                        ].map((r) => {
                                            const start = toLocalYMD(new Date(new Date().setDate(new Date().getDate() - r.range)));
                                            const end = toLocalYMD(new Date());
                                            const isActive = dateRange.start === start && dateRange.end === end;
                                            return (
                                                <button
                                                    key={r.label}
                                                    onClick={() => setDateRange({ start, end })}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                                        isActive
                                                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                                            : "text-slate-400 hover:text-blue-600 dark:hover:text-slate-200"
                                                    )}
                                                >
                                                    {r.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="h-10 px-4 flex-1 sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono"
                                        />
                                        <span className="text-slate-300 dark:text-slate-700 font-black">—</span>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="h-10 px-4 flex-1 sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                    />
                )}
            </div>

        </div>
    );
};

export default SalesHistoryPage;
