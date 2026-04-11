import { useState, useEffect } from 'react';
import StockOverviewCards from '@/components/store-admin/StockOverviewCards';
import { fetchProducts } from '@/api/products.api';
import { fetchFullInventory } from '@/api/inventory.api';
import { Search, Download, Plus, Box, Filter } from 'lucide-react';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

const StockLevelsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const [productsDataRes, setProductsDataRes] = useState<any>(null);
    const [productsLoading, setProductsLoading] = useState(true);
    const [inventoryDataRes, setInventoryDataRes] = useState<any>(null);
    const [inventoryLoading, setInventoryLoading] = useState(true);

    const loadData = async () => {
        setProductsLoading(true);
        setInventoryLoading(true);
        try {
            const [products, inventory] = await Promise.all([
                fetchProducts(),
                fetchFullInventory()
            ]);
            setProductsDataRes(products);
            setInventoryDataRes(inventory);
        } catch (error) {
            console.error("Failed to load stock data:", error);
        } finally {
            setProductsLoading(false);
            setInventoryLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loading = productsLoading || inventoryLoading;

    // Process data
    const productsData = (productsDataRes as any)?.data || (Array.isArray(productsDataRes) ? productsDataRes : []);
    const inventoryData = (inventoryDataRes as any)?.data || (Array.isArray(inventoryDataRes) ? inventoryDataRes : []);

    // Map inventory by productId
    const inventoryMap = inventoryData.reduce((acc: any, inv: any) => {
        acc[inv.productId] = inv.totalQuantity || inv.stock || 0;
        return acc;
    }, {});

    const inventory = productsData.map((item: any) => {
        const stock = inventoryMap[item.id] || 0;
        return {
            id: item.id || item._id,
            productName: item.name || item.productName || 'Unnamed Product',
            sku: item.sku || 'N/A',
            currentStock: stock,
            reorderLevel: item.reorderLevel || 10,
            category: typeof item.category === 'object' ? item.category?.name : item.category || 'General',
            image: (item.image || item.imageUrl) ? `http://localhost:3005${item.image || item.imageUrl}` : null
        };
    });

    const stats = {
        totalItems: inventory.length,
        lowStockItems: inventory.filter((i: any) => i.currentStock > 0 && i.currentStock <= i.reorderLevel).length,
        outOfStockItems: inventory.filter((i: any) => i.currentStock === 0).length
    };

    const columns: ColumnDef<any>[] = [
        {
            header: "ID",
            cell: ({ row }) => (
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                    {String(row.index + 1).padStart(2, '0')}
                </div>
            )
        },
        {
            header: "Product",
            accessorKey: "productName",
            cell: ({ row }) => (
                <div className="text-center">
                    <p className="text-xs font-black text-[#1e293b] dark:text-white uppercase tracking-tight truncate">
                        {row.getValue("productName")}
                    </p>
                </div>
            )
        },
        {
            header: "SKU",
            accessorKey: "sku",
            cell: ({ row }) => (
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">
                        {row.getValue("sku")}
                    </p>
                </div>
            )
        },
        {
            header: "Category",
            accessorKey: "category",
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-[2px] border border-slate-100 dark:border-slate-800">
                        {row.getValue("category") || 'General'}
                    </span>
                </div>
            )
        },
        {
            header: "Stock",
            accessorKey: "currentStock",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="text-center">
                        <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest tabular-nums",
                            item.currentStock === 0 ? "text-rose-600" : item.currentStock <= item.reorderLevel ? "text-amber-600" : "text-[#1e293b] dark:text-slate-100"
                        )}>
                            {item.currentStock}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Reorder",
            accessorKey: "reorderLevel",
            cell: ({ row }) => (
                <div className="text-center">
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest tabular-nums leading-none">
                        {row.getValue<number>("reorderLevel")}
                    </span>
                </div>
            )
        },
        {
            header: "Status",
            cell: ({ row }) => {
                const item = row.original;
                const current = item.currentStock;
                const reorder = item.reorderLevel;
                
                if (current === 0) {
                    return (
                        <div className="flex justify-center text-center">
                            <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-[2px] leading-tight border border-rose-100 dark:border-rose-950/50">
                                Out of Stock
                            </span>
                        </div>
                    );
                }
                if (current <= reorder) {
                    return (
                        <div className="flex justify-center text-center">
                            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-[2px] leading-tight border border-amber-100 dark:border-amber-950/50">
                                Low Stock
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex justify-center text-center">
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-[2px] leading-tight border border-emerald-100 dark:border-emerald-950/50">
                            Healthy
                        </span>
                    </div>
                );
            }
        }
    ];

    const filteredInventory = (() => {
        let result = [...inventory];

        // Apply Search
        if (searchQuery) {
            result = result.filter(item =>
                item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply Status Filter
        if (activeFilter === 'Low') {
            result = result.filter(item => item.currentStock > 0 && item.currentStock <= item.reorderLevel);
        } else if (activeFilter === 'Out') {
            result = result.filter(item => item.currentStock === 0);
        } else if (activeFilter === 'OK') {
            result = result.filter(item => item.currentStock > item.reorderLevel);
        }

        return result;
    })();

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        <span>Inventory</span>
                        <span>/</span>
                        <span className="text-[#2563EB]">Stock Levels</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Stock Levels</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#2563EB]/30 hover:text-[#2563EB] transition-all">
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E1B4B] dark:bg-blue-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-[#1E1B4B]/20 dark:shadow-blue-500/20 hover:bg-[#2563EB] dark:hover:bg-blue-700 transition-all border border-[#1E1B4B]/20 dark:border-blue-500">
                        <Plus size={18} />
                        Adjust Stock
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <StockOverviewCards stats={stats} loading={loading} />

            {/* Filters & Table Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
                <DataTable 
                    columns={columns} 
                    data={filteredInventory}
                    isLoading={loading}
                    onRefresh={loadData}
                    placeholder="Search inventory..."
                    hidePagination={false}
                    manualPagination={false}
                    exportFilename="Stock-Levels-Report"
                    headerActions={
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search product, SKU..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                                />
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl h-10 px-2">
                                {['All', 'OK', 'Low', 'Out'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            activeFilter === filter
                                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-slate-400 dark:text-slate-550 hover:text-blue-600 dark:hover:text-blue-400"
                                        )}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default StockLevelsPage;
