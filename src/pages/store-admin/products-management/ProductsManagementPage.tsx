import React, { useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ProductsHeader from "@/components/store-admin/ProductsHeader"
import AddProductModal from "@/components/store-admin/AddProductModal"
import MetricCard from "@/components/global-components/MetricCard";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Plus, Trash, Edit, Box, Search, ShoppingCart, PackageOpen, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatCurrencyShort, formatAmountShort, formatNumberShort } from "@/utils/format";
import AddStockModal from "@/components/store-admin/AddStockModal";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { useDebounce } from '@/hooks';
import { useSocket } from "@/hooks/useSocket";

import { fetchProducts, deleteProduct } from "@/api/products.api";
import { fetchFullInventory } from "@/api/inventory.api";
import { getCategories } from "@/api/category.api"

export default function ProductsManagementPage() {
    const [openOpeningModal, setOpenOpeningModal] = useState(false)
    const [openMasterModal, setOpenMasterModal] = useState(false)

    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500);
    const [categoryId, setCategoryId] = useState('all')
    const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const queryClient = useQueryClient();

    // Delete and Edit state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [productToEdit, setProductToEdit] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, categoryId, isActiveFilter]);

    // Queries
    const { data: catRes } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories(),
        staleTime: 1000 * 60 * 60, // Cache categories for an hour
    });
    const categories = catRes?.data?.data || (Array.isArray(catRes?.data) ? catRes?.data : []);

    const { 
        data: productsRes, 
        isLoading: productsLoading, 
        refetch: refetchProducts 
    } = useQuery({
        queryKey: ['products-catalog', debouncedSearch, categoryId, isActiveFilter, page, limit],
        queryFn: () => fetchProducts({
            page,
            limit,
            ...(debouncedSearch && { search: debouncedSearch }),
            ...(categoryId !== 'all' && { categoryId }),
            ...(isActiveFilter !== 'all' && { isActive: isActiveFilter === 'true' })
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 60000, // 1 minute stale time
    });

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('inventory:updated', (data: any) => {
            console.log('📡 [ProductsCatalog] Inventory update received:', data);
            queryClient.invalidateQueries({ queryKey: ['products-catalog'] });
            queryClient.invalidateQueries({ queryKey: ['pos-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        });

        return () => {
            socket.off('inventory:updated');
        };
    }, [socket, queryClient]);

    const products = useMemo(() => {
        const productsRaw = productsRes?.data?.data || productsRes?.data || (Array.isArray(productsRes) ? productsRes : [])
        
        return (Array.isArray(productsRaw) ? productsRaw : []).map((p: any) => ({
            ...p,
            stock: p.inventoryStock?.totalQuantity ?? 0
        }));
    }, [productsRes]);

    const meta = productsRes?.data?.meta || productsRes?.meta;
    const totalItems = meta?.total || 0;
    const stats = meta?.stats || { totalProducts: 0, activeProducts: 0, lowStockProducts: 0 };
    const pageCount = meta?.totalPages || 1;

    const summary = useMemo(() => {
        return {
            total: stats.totalProducts,
            lowStock: stats.lowStockProducts,
            active: stats.activeProducts
        };
    }, [stats]);

    const handleRefresh = () => {
        refetchProducts();
    }

    const confirmDelete = (product: any) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await deleteProduct(productToDelete.id);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            handleRefresh();
            // Invalidate POS products too
            queryClient.invalidateQueries({ queryKey: ['pos-products'] });
        } catch (error) {
            console.error("Failed to delete product:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            id: "rowNumber",
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
                    {formatAmountShort(row.original.purchasePrice || 0)}
                </div>
            )
        },
        {
            header: "Selling",
            accessorKey: "sellingPrice",
            cell: ({ row }) => (
                <div className="text-center text-[#1e293b] dark:text-slate-300 text-[11px] font-black uppercase tracking-widest tabular-nums">
                    {formatAmountShort(row.original.sellingPrice || 0)}
                </div>
            )
        },
        {
            header: "Disc. %",
            cell: ({ row }) => {
                const disc = Number(row.original.latestDiscountPercentage ?? row.original.discountPercentage ?? 0);
                return (
                    <div className="text-center">
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                            disc > 0 ? "bg-rose-50 text-rose-600 border border-rose-100" : "text-slate-400"
                        )}>
                            {disc > 0 ? `${disc}% OFF` : '0%'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Latest Price",
            cell: ({ row }) => {
                const base = parseFloat(row.original.latestSellingPrice || row.original.sellingPrice || 0);
                const disc = Number(row.original.latestDiscountPercentage ?? row.original.discountPercentage ?? 0);
                const net = base * (1 - disc / 100);
                return (
                    <div className="text-center text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-widest tabular-nums">
                        {formatAmountShort(net)}
                    </div>
                );
            }
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
                        variant="ghost"
                        size="icon"
                        onClick={() => setProductToEdit(row.original)}
                        className="w-9 h-9 text-slate-300 dark:text-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 rounded-xl"
                    >
                        <Edit size={16} />
                    </Button>
                    <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(row.original)}
                        className="w-9 h-9 text-slate-300 dark:text-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 rounded-xl"
                    >
                        <Trash size={16} />
                    </Button>
                </div>
            )
        }
    ], []);

    return (
        <div className="animate-fade-in space-y-8">
            <ProductsHeader
                openOpeningModal={() => setOpenOpeningModal(true)}
                openMasterModal={() => setOpenMasterModal(true)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <MetricCard 
                    title="Total Products" 
                    value={summary.total} 
                    icon={ShoppingCart} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Active Products" 
                    value={summary.active} 
                    icon={PackageOpen} 
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard 
                    title="Low Stock" 
                    value={summary.lowStock} 
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
                {productsLoading && products.length === 0 ? (
                    <TableSkeleton columns={7} rows={10} />
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={products}
                        isLoading={productsLoading}
                        onRefresh={handleRefresh}
                        manualPagination={true}
                        pageCount={pageCount}
                        pageIndex={page}
                        onPageChange={setPage}
                        totalItems={totalItems}
                        pageSize={limit}
                        placeholder="Search catalog..."
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

            <AddProductModal
                open={!!productToEdit}
                onClose={() => setProductToEdit(null)}
                onSuccess={() => handleRefresh()}
                product={productToEdit}
                mode="master"
            />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" 
                        onClick={() => !isDeleting && setIsDeleteModalOpen(false)} 
                    />
                    
                    <div className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
                                <Trash size={20} />
                            </div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Delete Product?</h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                                Are you sure you want to delete <span className="text-rose-500">"{productToDelete?.name}"</span>? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Yes, Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

