import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import StockAdjustmentForm from '@/components/store-admin/StockAdjustmentForm';
import StockAdjustmentTable from '@/components/store-admin/StockAdjustmentTable';
import { fetchProducts } from '@/api/products.api';
import { fetchInventoryLogs } from '@/api/inventory.api';
import { getAuditLogs } from '@/api/reports.api';
import { Skeleton } from '@/components/ui/skeleton';

const StockAdjustmentPage = () => {
    // 1. Pagination & Filtering State
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // 2. Main Query: Inventory Logs (Recent Adjustments)
    // We cache this for 30s to allow "snappy" navigation back to this page.
    const { 
        data: logsRes, 
        isLoading: logsLoading, 
        refetch: refetchLogs 
    } = useQuery({
        queryKey: ['inventory-logs-adjustments', page],
        queryFn: () => fetchInventoryLogs({ limit: pageSize, page }),
        staleTime: 30000,
        placeholderData: (prev) => prev
    });

    // 3. Products Query: Needed for the search/selection in the form
    // We use a separate key that can be shared across the app for caching.
    const { 
        data: productsRes, 
        isLoading: productsLoading 
    } = useQuery({
        queryKey: ['products-catalog-lite'], 
        queryFn: () => fetchProducts({ limit: 100 }), // Fetching a smaller subset/recent for the form
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const products = productsRes?.data?.data || productsRes?.data || [];
    const logsRaw = logsRes?.data?.data || logsRes?.data || [];
    const totalItems = logsRes?.data?.total || 0;

    // 4. Enrichment (Matching names is now handled by the backend join mostly)
    const enrichedLogs = useMemo(() => {
        return (Array.isArray(logsRaw) ? logsRaw : []).map((log: any) => ({
            ...log,
            // Fallback to "System" if user isn't joined
            user: log.user || { name: 'System', role: 'SYSTEM' }
        }));
    }, [logsRaw]);

    const handleSuccess = () => {
        setPage(1);
        refetchLogs();
    };

    const loading = logsLoading || productsLoading;

    if (loading && !logsRes) {
        return (
            <div className="space-y-12 animate-fade-in p-6">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="w-full">
                    <Skeleton className="h-[350px] rounded-[40px]" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Header Area */}
            <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    <span>Inventory</span>
                    <span>/</span>
                    <span className="text-blue-600">Stock Adjustment</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Stock Adjustment</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold">Manage inventory adjustments and reasons.</p>
            </div>

            <div className="space-y-12">
                {/* Adjustment Form */}
                <div className="w-full">
                    <StockAdjustmentForm products={products} onSuccess={handleSuccess} />
                </div>

                {/* Recent Adjustments Table */}
                <StockAdjustmentTable 
                    adjustments={enrichedLogs} 
                    totalItems={totalItems}
                    pageIndex={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
};

export default StockAdjustmentPage;
