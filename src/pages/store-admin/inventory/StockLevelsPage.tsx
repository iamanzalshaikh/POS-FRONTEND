import { useState } from 'react';
import StockOverviewCards from '@/components/store-admin/StockOverviewCards';
import StockTable from '@/components/store-admin/StockTable';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/api/products.api';
import { fetchFullInventory } from '@/api/inventory.api';
import { Search, Download, Plus } from 'lucide-react';

const StockLevelsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // React Query Hooks
    const { data: productsDataRes, isLoading: productsLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => fetchProducts(),
    });
    const { data: inventoryDataRes, isLoading: inventoryLoading } = useQuery({
        queryKey: ['inventory', { lowStock: false }],
        queryFn: fetchFullInventory,
    });

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
            image: item.image || item.imageUrl
        };
    });

    const stats = {
        totalItems: inventory.length,
        lowStockItems: inventory.filter((i: any) => i.currentStock > 0 && i.currentStock <= i.reorderLevel).length,
        outOfStockItems: inventory.filter((i: any) => i.currentStock === 0).length
    };

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
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-[#2563EB]/5 focus:border-[#2563EB]/30 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter Chips */}
                    <div className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        {['All', 'OK', 'Low', 'Out'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeFilter === filter
                                    ? 'bg-white dark:bg-slate-700 text-[#2563EB] dark:text-blue-400 shadow-sm border border-[#2563EB]/10 dark:border-blue-400/20'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-[#2563EB] dark:hover:text-blue-400'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <StockTable items={filteredInventory} loading={loading} />
            </div>
        </div>
    );
};

export default StockLevelsPage;
