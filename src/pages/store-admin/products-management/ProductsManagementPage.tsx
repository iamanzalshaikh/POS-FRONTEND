import { useEffect, useState } from "react"
import ProductsHeader from "@/components/store-admin/ProductsHeader"
import AddProductModal from "@/components/store-admin/AddProductModal"
import MetricCard from "@/components/global-components/MetricCard";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Plus, Trash, Box, Search, ShoppingCart, PackageOpen, AlertTriangle } from 'lucide-react';
import { formatCurrency } from "@/utils/format";
import AddStockModal from "@/components/store-admin/AddStockModal";

import { fetchProducts } from "@/api/products.api";
import { fetchFullInventory } from "@/api/inventory.api";
import { getCategories } from "@/api/category.api"

export default function ProductsManagementPage() {
    const [openModal, setOpenModal] = useState(false)

    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [selectedProductForStock, setSelectedProductForStock] = useState<any>(null);

    const [search, setSearch] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [isActiveFilter, setIsActiveFilter] = useState<string>('all')

    const [categories, setCategories] = useState<any[]>([])

    // Load categories (can be optimized with useQuery later if needed, but for now matching existing loadCategories pattern)
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await getCategories()
                const cats = res.data?.data || (Array.isArray(res.data) ? res.data : [])
                setCategories(cats)
            } catch (error) {
                console.error("Failed to load categories:", error)
            }
        }
        void loadCategories()
    }, [])

    const [productsDataRes, setProductsDataRes] = useState<any>(null);
    const [productsLoading, setProductsLoading] = useState(true);
    const [inventoryDataRes, setInventoryDataRes] = useState<any>(null);
    const [inventoryLoading, setInventoryLoading] = useState(true);

    const queryParams: any = {}
    if (search) queryParams.search = search;
    if (categoryId && categoryId !== 'all') queryParams.categoryId = categoryId;
    if (isActiveFilter !== 'all') queryParams.isActive = isActiveFilter === 'true';

    const loadProducts = async () => {
        setProductsLoading(true);
        try {
            const data = await fetchProducts(queryParams);
            setProductsDataRes(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setProductsLoading(false);
        }
    };

    const loadInventory = async () => {
        setInventoryLoading(true);
        try {
            const data = await fetchFullInventory();
            setInventoryDataRes(data);
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
        } finally {
            setInventoryLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [search, categoryId, isActiveFilter]);

    useEffect(() => {
        loadInventory();
    }, []);

    const refetchProducts = () => {
        loadProducts();
        loadInventory();
    };

    const loading = productsLoading || inventoryLoading;

    // Merge Logic
    const getMergedProducts = () => {
        const productsRaw = productsDataRes?.data || (Array.isArray(productsDataRes) ? productsDataRes : [])
        const inventoryRaw = inventoryDataRes?.data || (Array.isArray(inventoryDataRes) ? inventoryDataRes : [])

        const inventoryMap = inventoryRaw.reduce((acc: any, inv: any) => {
            acc[inv.productId] = inv.totalQuantity || inv.stock || 0
            return acc
        }, {})

        return productsRaw.map((p: any) => ({
            ...p,
            stock: inventoryMap[p.id] || 0
        }))
    }

    const products = getMergedProducts()

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
            header: "Image",
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-blue-600/20 transition-all shrink-0">
                            {product.image ? (
                                <img 
                                    src={`http://localhost:3005${product.image}`} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700">
                                    <Box size={20} strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Product Details",
            accessorKey: "name",
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="min-w-[150px]">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                                {product.name}
                            </p>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border",
                                product.isActive 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
                                    : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
                            )}>
                                {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[2px] mt-0.5">SKU: {product.sku || 'N/A'}</p>
                    </div>
                );
            }
        },
        {
            header: "Category",
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-[2px]">
                        {row.original.category?.name || 'General'}
                    </span>
                </div>
            )
        },
        {
            header: "Buying",
            accessorKey: "purchasePrice",
            cell: ({ row }) => (
                <div className="text-right text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest tabular-nums">
                    {formatCurrency(Number(row.getValue("purchasePrice")))}
                </div>
            )
        },
        {
            header: "Selling",
            accessorKey: "sellingPrice",
            cell: ({ row }) => (
                <div className="text-right text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-widest tabular-nums">
                    {formatCurrency(Number(row.getValue("sellingPrice")))}
                </div>
            )
        },
        {
            header: "In Stock",
            cell: ({ row }) => {
                const stock = row.original.stock ?? 0;
                const reorder = row.original.reorderLevel || 10;
                return (
                    <div className="flex justify-center">
                        <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[2px] border",
                            stock === 0 ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" :
                            stock <= reorder ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
                            "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                        )}>
                            {stock} UNITS
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
                        onClick={() => {
                            setSelectedProductForStock(row.original);
                            setIsAddStockModalOpen(true);
                        }}
                        className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90 border border-blue-100 dark:border-blue-900/50 group"
                        title="Add Stock"
                    >
                        <Plus size={16} />
                    </button>
                    <button className="p-2.5 text-slate-300 dark:text-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-90">
                        <Trash size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <ProductsHeader openModal={() => setOpenModal(true)} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <MetricCard 
                    title="Total Products" 
                    value={String(products.length)} 
                    icon={ShoppingCart} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Active Store" 
                    value={String(products.filter((p: any) => p.isActive).length)} 
                    icon={PackageOpen} 
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard 
                    title="Low Stock" 
                    value={String(products.filter((p: any) => p.stock > 0 && p.stock <= (p.reorderLevel || 10)).length)} 
                    icon={AlertTriangle} 
                    colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                />
                <MetricCard 
                    title="Categories" 
                    value={String(categories.length)} 
                    icon={Box} 
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
                <DataTable 
                    columns={columns} 
                    data={products}
                    isLoading={loading}
                    onRefresh={refetchProducts}
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
            </div>

            <AddStockModal 
                open={isAddStockModalOpen} 
                onClose={() => setIsAddStockModalOpen(false)} 
                product={selectedProductForStock} 
                onSuccess={() => refetchProducts()}
            />

            <AddProductModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSuccess={() => refetchProducts()}
            />
        </div>
    )
}
