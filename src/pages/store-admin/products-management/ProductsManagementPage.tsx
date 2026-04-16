import { useState, useMemo } from "react"
import { useQuery } from '@tanstack/react-query';
import ProductsHeader from "@/components/store-admin/ProductsHeader"
import AddProductModal from "@/components/store-admin/AddProductModal"
import MetricCard from "@/components/global-components/MetricCard";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Plus, Trash, Box, Search, ShoppingCart, PackageOpen, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatCurrencyShort, formatAmountShort, formatNumberShort } from "@/utils/format";
import AddStockModal from "@/components/store-admin/AddStockModal";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";

import { fetchProducts } from "@/api/products.api";
import { fetchFullInventory } from "@/api/inventory.api";
import { getCategories } from "@/api/category.api"

export default function ProductsManagementPage() {
    const [openOpeningModal, setOpenOpeningModal] = useState(false)
    const [openMasterModal, setOpenMasterModal] = useState(false)

    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);

    const [search, setSearch] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [isActiveFilter, setIsActiveFilter] = useState<string>('all')

    // Queries
    const { data: catRes } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories(),
        staleTime: 1000 * 60 * 10,
    });
    const categories = catRes?.data?.data || (Array.isArray(catRes?.data) ? catRes?.data : []);

    const queryParams: any = {}
    if (search) queryParams.search = search;
    if (categoryId && categoryId !== 'all') queryParams.categoryId = categoryId;
    if (isActiveFilter !== 'all') queryParams.isActive = isActiveFilter === 'true';

    const { 
        data: productsRes, 
        isLoading: productsLoading, 
        refetch: refetchProducts 
    } = useQuery({
        queryKey: ['products', search, categoryId, isActiveFilter],
        queryFn: () => fetchProducts(queryParams),
        staleTime: 1000 * 60 * 5,
    });

    const { 
        data: inventoryRes, 
        isLoading: inventoryLoading, 
        refetch: refetchInventory 
    } = useQuery({
        queryKey: ['inventory-full'],
        queryFn: () => fetchFullInventory(),
        staleTime: 1000 * 60 * 5,
    });

    const loading = productsLoading || inventoryLoading;

    const products = useMemo(() => {
        const productsRaw = productsRes?.data?.data || productsRes?.data || (Array.isArray(productsRes) ? productsRes : [])
        const invResData = inventoryRes?.data
        const inventoryRaw = Array.isArray(invResData) ? invResData : (invResData?.data || [])

        const inventoryMap = inventoryRaw.reduce((acc: any, inv: any) => {
            acc[inv.productId] = inv.totalQuantity || inv.stock || 0
            return acc
        }, {})

        return productsRaw.map((p: any) => ({
            ...p,
            stock: inventoryMap[p.id] || 0
        }))
    }, [productsRes, inventoryRes]);

    const handleRefresh = () => {
        refetchProducts();
        refetchInventory();
    }

    const columns: ColumnDef<any>[] = [
        {
            header: "ID",
            cell: ({ row }) => (
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                    {(row.index + 1).toString().padStart(2, '0')}
                </div>
            )
        },
        {
            header: "Product Name",
            accessorKey: "name",
            cell: ({ row }) => (
                <div className="text-center">
                    <p className="text-sm font-black text-[#1e293b] dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                        {row.original.name}
                    </p>
                </div>
            )
        },
        {
            header: "SKU",
            accessorKey: "sku",
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[2px]">
                        {row.original.sku || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            header: "Category",
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-[2px] border border-slate-100 dark:border-slate-800">
                        {row.original.category?.name || 'General'}
                    </span>
                </div>
            )
        },
        {
            header: "Buying",
            accessorKey: "purchasePrice",
            cell: ({ row }) => (
                <div className="text-center text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest tabular-nums">
                    {formatAmountShort(row.getValue("purchasePrice"))}
                </div>
            )
        },
        {
            header: "Selling",
            accessorKey: "sellingPrice",
            cell: ({ row }) => (
                <div className="text-center text-[#1e293b] dark:text-slate-300 text-[11px] font-black uppercase tracking-widest tabular-nums">
                    {formatAmountShort(row.getValue("sellingPrice"))}
                </div>
            )
        },
        {
            header: "Latest",
            accessorKey: "latestSellingPrice",
            cell: ({ row }) => (
                <div className="text-center text-emerald-600 text-[11px] font-black uppercase tracking-widest tabular-nums animate-pulse">
                    {formatAmountShort(row.original.latestSellingPrice || row.original.sellingPrice)}
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "isActive",
            cell: ({ row }) => (
                <div className="flex justify-center text-center">
                    <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        row.original.isActive 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
                            : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
                    )}>
                        {row.original.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )
        },
        {
            header: "In Stock",
            cell: ({ row }) => {
                const stock = row.original.stock ?? 0;
                const reorder = row.original.reorderLevel || 10;
                return (
                    <div className="flex justify-center text-center">
                        <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[2px] border",
                            stock === 0 ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" :
                            stock <= reorder ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
                            "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50"
                        )}>
                            {formatNumberShort(stock)} UNITS
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
                    <Button 
                        variant="secondary"
                        size="icon"
                        onClick={() => {
                            setSelectedProductForStock(row.original);
                            setIsAddStockModalOpen(true);
                        }}
                        className="w-9 h-9 rounded-xl"
                        title="Add Stock"
                    >
                        <Plus size={16} />
                    </Button>
                    <Button 
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 text-slate-300 dark:text-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 rounded-xl"
                    >
                        <Trash size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <ProductsHeader
                openOpeningModal={() => setOpenOpeningModal(true)}
                openMasterModal={() => setOpenMasterModal(true)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <MetricCard 
                    title="Total Products" 
                    value={products.length} 
                    icon={ShoppingCart} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Active Store" 
                    value={products.filter((p: any) => p.isActive).length} 
                    icon={PackageOpen} 
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard 
                    title="Low Stock" 
                    value={products.filter((p: any) => p.stock > 0 && p.stock <= (p.reorderLevel || 10)).length} 
                    icon={AlertTriangle} 
                    colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                />
                <MetricCard 
                    title="Categories" 
                    value={categories.length} 
                    icon={Box} 
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
                {loading && products.length === 0 ? (
                    <TableSkeleton columns={7} rows={10} />
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={products}
                        isLoading={loading}
                        onRefresh={handleRefresh}
                        placeholder="Search catalog..."
                        hidePagination={false}
                        manualPagination={false}
                        exportFilename="Products-Catalog"
                        headerActions={
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                                    />
                                </div>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[160px]"
                                >
                                    <option value="all">Categories: All</option>
                                    {categories.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={isActiveFilter}
                                    onChange={(e) => setIsActiveFilter(e.target.value)}
                                    className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[140px]"
                                >
                                    <option value="all">Status: All</option>
                                    <option value="true">Active Only</option>
                                    <option value="false">Inactive Only</option>
                                </select>
                            </div>
                        }
                    />
                )}
            </div>

            <AddStockModal 
                open={isAddStockModalOpen} 
                onClose={() => setIsAddStockModalOpen(false)} 
                product={selectedProductForStock} 
                onSuccess={() => handleRefresh()}
            />

            <AddProductModal
                open={openOpeningModal}
                onClose={() => setOpenOpeningModal(false)}
                onSuccess={() => handleRefresh()}
                mode="opening"
            />

            <AddProductModal
                open={openMasterModal}
                onClose={() => setOpenMasterModal(false)}
                onSuccess={() => handleRefresh()}
                mode="master"
            />
        </div>
    )
}
