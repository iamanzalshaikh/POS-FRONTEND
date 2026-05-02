import React, { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

const SocketInvalidator: React.FC = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        console.log('📡 [SocketInvalidator] Listeners active');

        const invalidate = (keys: any[], message?: string, title: string = 'Real-time Update') => {
            console.log(`🔄 [Socket] Invalidating keys:`, keys);
            keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
            if (message) {
                toast.info(message, title);
            }
        };

        // 1. Inventory Updates
        socket.on('STOCK_UPDATED', (data) => {
            invalidate(
                ['inventory', 'products', 'inventory-logs-adjustments', 'pos-products', 'low-stock'],
                'Stock levels updated across the store'
            );
        });

        // 2. Sales Updates
        socket.on('SALE_CREATED', (data) => {
            invalidate(
                [
                    'sales', 
                    'dashboard-summary', 
                    'recent-sales', 
                    'daily-sales-chart',
                    'accountant-pnl-summary',
                    'accountant-pnl-sales'
                ],
                `New sale recorded: #${data.invoiceNumber || 'Invoice'}`
            );
        });

        // 3. Purchase Updates
        socket.on('PURCHASE_CREATED', (data) => {
            invalidate(
                ['supplier-purchases', 'suppliers', 'inventory', 'accountant-pnl-summary', 'accountant-pnl-expenses'],
                'New stock purchase recorded'
            );
        });

        // 4. Expense Updates
        socket.on('EXPENSE_CREATED', (data) => {
            invalidate(
                ['expenses', 'finance-summary', 'dashboard-summary', 'accountant-pnl-summary', 'accountant-pnl-expenses'],
                'New expense added to ledger'
            );
        });

        // 5. Supplier Updates (Balance changes etc)
        socket.on('SUPPLIER_UPDATED', (data) => {
            invalidate(['suppliers', 'supplier-purchases', 'accountant-pnl-summary']);
        });

        // 6. Staff & Payroll Updates
        socket.on('STAFF_UPDATED', (data) => {
            invalidate(
                ['staff', 'staff-summary', 'accountant-pnl-summary'],
                `Staff information updated`
            );
        });

        socket.on('PAYROLL_UPDATED', (data) => {
            invalidate(
                ['payroll', 'payroll-history', 'finance-summary', 'accountant-pnl-summary', 'accountant-pnl-expenses'],
                'Payroll records updated'
            );
        });

        // 7. Generic Dashboard Refresh
        socket.on('DASHBOARD_UPDATED', () => {
            invalidate(['dashboard-summary', 'finance-summary', 'accountant-pnl-summary', 'accountant-pnl-sales', 'accountant-pnl-expenses']);
        });

        // Legacy compatibility
        socket.on('inventory:updated', () => {
            invalidate(['inventory', 'products', 'pos-products']);
        });

        return () => {
            socket.off('STOCK_UPDATED');
            socket.off('SALE_CREATED');
            socket.off('PURCHASE_CREATED');
            socket.off('EXPENSE_CREATED');
            socket.off('SUPPLIER_UPDATED');
            socket.off('STAFF_UPDATED');
            socket.off('PAYROLL_UPDATED');
            socket.off('DASHBOARD_UPDATED');
            socket.off('inventory:updated');
        };
    }, [socket, queryClient]);

    return null; // This component doesn't render anything
};

export default SocketInvalidator;
