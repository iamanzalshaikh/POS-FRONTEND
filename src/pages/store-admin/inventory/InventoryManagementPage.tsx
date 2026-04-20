import React, { useState, useEffect, useMemo } from "react"
import InventoryHeader from "@/components/store-admin/InventoryHeader"
import { fetchInventoryLogs } from "@/api/inventory.api";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Search, Box, User, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks';

export interface InventoryMovement {
  id: string
  productName: string
  sku: string
  image: string | null
  quantityChange: number
  changeType: "sale" | "restock" | "adjustment"
  referenceId: string
  user: string
  timestamp: string
}

const InventoryManagementPage = () => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [typeFilter, setTypeFilter] = useState("All Movements")
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter]);

  const { data: inventoryDataRes, isLoading, refetch } = useQuery({
    queryKey: ['inventory-logs', debouncedSearch, typeFilter, page, limit],
    queryFn: () => fetchInventoryLogs({
      page,
      limit,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(typeFilter !== 'All Movements' && { changeType: typeFilter.toUpperCase() })
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });

  const movementsRaw = inventoryDataRes?.data?.logs || [];
  const totalItems = inventoryDataRes?.data?.pagination?.total || 0;
  const pageCount = Math.ceil(totalItems / limit) || 1;

  const movements: InventoryMovement[] = useMemo(() => {
    return (Array.isArray(movementsRaw) ? movementsRaw : []).map((m: any) => ({
      id: m.id,
      productName: m.product?.name || "Unknown Product",
      sku: m.product?.sku || "N/A",
      quantityChange: m.quantityChange,
      changeType: m.changeType,
      referenceId: m.referenceId || m.id.slice(0, 8),
      user: m.user?.name || "System",
      timestamp: m.createdAt,
      image: m.product?.image ? `http://localhost:3005${m.product.image}` : null
    }));
  }, [movementsRaw]);

  const columns: ColumnDef<InventoryMovement>[] = useMemo(() => [
    {
        header: "Product",
        accessorKey: "productName",
        meta: { align: 'left' },
        cell: ({ row }) => (
            <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm">
                    {row.original.image ? (
                        <img src={row.original.image} alt={row.original.productName} className="w-full h-full object-cover" />
                    ) : (
                        <Box size={20} className="text-slate-300" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.productName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">SKU: {row.original.sku}</p>
                </div>
            </div>
        )
    },
    {
        header: "Movement",
        accessorKey: "quantityChange",
        cell: ({ row }) => {
            const change = row.original.quantityChange;
            const isPositive = change > 0;
            return (
                <div className="text-center font-black">
                    <span className={cn(
                        "flex items-center justify-center gap-1.5 text-xs tabular-nums uppercase tracking-widest px-3 py-1 rounded-lg border",
                        isPositive 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
                            : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
                    )}>
                        {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {isPositive ? '+' : ''}{change}
                    </span>
                </div>
            )
        }
    },
    {
        header: "Type",
        accessorKey: "changeType",
        cell: ({ row }) => (
            <div className="text-center">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-[2px]">
                    {row.original.changeType}
                </span>
            </div>
        )
    },
    {
        header: "Reference",
        accessorKey: "referenceId",
        cell: ({ row }) => (
            <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">#{row.original.referenceId}</span>
            </div>
        )
    },
    {
        header: "Operator",
        accessorKey: "user",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 justify-center">
                <User size={12} className="text-slate-300" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{row.original.user}</span>
            </div>
        )
    },
    {
        id: "date",
        header: "Date",
        accessorKey: "timestamp",
        cell: ({ row }) => (
            <div className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest tabular-nums leading-none">
                {new Date(row.original.timestamp).toLocaleDateString()}
            </div>
        )
    },
    {
        id: "time",
        header: "Time",
        accessorKey: "timestamp",
        cell: ({ row }) => (
            <div className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest tabular-nums leading-none">
                {new Date(row.original.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        )
    }
  ], []);

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      <InventoryHeader />
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable 
            columns={columns} 
            data={movements}
            isLoading={isLoading}
            onRefresh={refetch}
            manualPagination={true}
            pageCount={pageCount}
            pageIndex={page}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={limit}
            placeholder="Search movements..."
            headerActions={
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl h-10 px-2">
                        {['All Movements', 'Sale', 'Restock', 'Adjustment'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setTypeFilter(m)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    typeFilter === m
                                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-slate-400 hover:text-blue-600"
                                )}
                            >
                                {m === 'All Movements' ? 'All' : m}
                            </button>
                        ))}
                    </div>
                </div>
            }
        />
      </div>
    </div>
  )
}

export default InventoryManagementPage;
