import { useState } from 'react';
import StockAdjustmentForm from '@/components/store-admin/StockAdjustmentForm';
import StockAdjustmentTable from '@/components/store-admin/StockAdjustmentTable';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/api/products.api';
import { fetchInventoryLogs } from '@/api/inventory.api';
import { getAuditLogs } from '@/api/reports.api';

const StockAdjustmentPage = () => {
    // React Query Hooks
    const { data: productsRes } = useQuery({
        queryKey: ['products'],
        queryFn: () => fetchProducts(),
    });
    const { data: logsRes } = useQuery({
        queryKey: ['inventory-logs', { limit: 40 }],
        queryFn: () => fetchInventoryLogs({ limit: 40 }),
    });
    const { data: auditLogsRes } = useQuery({
        queryKey: ['audit-logs', { limit: 100 }],
        queryFn: () => getAuditLogs({ limit: 100 }),
    });

    const products = (productsRes as any)?.data || (Array.isArray(productsRes) ? productsRes : []);
    const logs = (logsRes as any)?.data || (Array.isArray(logsRes) ? logsRes : []);
    const auditLogs = (auditLogsRes as any)?.data?.logs || (Array.isArray(auditLogsRes?.logs) ? auditLogsRes.logs : []);

    // Merge Audit Logs into Inventory Logs to get User Attribution
    const enrichedLogs = logs.map((log: any) => {
        // 1. Try to find the direct AuditLog for this inventory log
        let audit = auditLogs.find((a: any) => a.entity === 'inventory_logs' && a.entityId === log.id);

        // 2. If not found, check if it's a SALE and find the sale's AuditLog
        if (!audit && log.changeType === 'SALE' && log.referenceId) {
            audit = auditLogs.find((a: any) => a.entity === 'sales' && a.entityId === log.referenceId);
        }

        // 3. If still not found, check if it's an OPENING_STOCK and find the product's AuditLog
        if (!audit && log.changeType === 'OPENING_STOCK') {
            audit = auditLogs.find((a: any) => a.entity === 'products' && a.entityId === log.productId && a.action === 'CREATE_PRODUCT');
        }

        return {
            ...log,
            user: audit?.user || { name: 'System', role: 'SYSTEM' }
        };
    });

    const handleSuccess = () => {
        // React Query handles invalidation in the mutation hook onSuccess
    };

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
                <div className="max-w-5xl">
                    <StockAdjustmentForm products={products} onSuccess={handleSuccess} />
                </div>

                {/* Recent Adjustments Table */}
                <StockAdjustmentTable adjustments={enrichedLogs} />
            </div>
        </div>
    );
};

export default StockAdjustmentPage;
