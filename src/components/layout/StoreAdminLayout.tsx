import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/MainSidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Columns2, Users, Boxes, ShoppingCart, Monitor, BarChart3, Settings, Layers, Package, Settings2, Truck, ClipboardList, PlusCircle } from 'lucide-react';

const storeAdminMenu = [
    { name: 'Dashboard', icon: Columns2, path: '/store-admin/dashboard' },
    {
        name: 'Inventory',
        icon: Boxes,
        path: '/store-admin/inventory',
        children: [
            { name: 'Stock Levels', icon: Layers, path: '/store-admin/inventory/stocks' },
            { name: 'Products', icon: Package, path: '/store-admin/inventory/products' },
            { name: 'Categories', icon: Layers, path: '/store-admin/categories' },
            { name: 'Adjustments', icon: Settings2, path: '/store-admin/inventory/adjustments' },
        ]
    },
    {
        name: 'Purchasing',
        icon: Truck,
        path: '/store-admin/purchasing/suppliers',
        children: [
            { name: 'Suppliers', icon: Truck, path: '/store-admin/purchasing/suppliers' },
            { name: 'Purchases', icon: ClipboardList, path: '/store-admin/purchasing/purchases' },
            { name: 'New purchase', icon: PlusCircle, path: '/store-admin/purchasing/purchases/new' },
        ]
    },
    { name: 'Sales History', icon: ShoppingCart, path: '/store-admin/sales' },
    { name: 'Devices', icon: Monitor, path: '/store-admin/devices' },
    { name: 'Reports', icon: BarChart3, path: '/store-admin/reports' },
    { name: 'User Management', icon: Users, path: '/store-admin/staff' },
    { name: 'Settings', icon: Settings, path: '/store-admin/settings' },
];

export default function StoreAdminLayout() {
    const { collapsed } = useSidebar();
    return (
        <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 transition-colors duration-500 text-slate-900 dark:text-slate-100 uppercase">
            {/* Sidebar */}
            <Sidebar menuItems={storeAdminMenu} roleName="Store Admin" />

            {/* Main Content */}
            <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <TopNavbar />

                <main className="p-4 md:p-6 lg:p-8 w-full transition-all duration-300">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
