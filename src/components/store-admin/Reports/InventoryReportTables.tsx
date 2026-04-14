import React from 'react';
import { AlertTriangle, XCircle, Package } from 'lucide-react';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { formatNumberShort } from '@/utils/format';

interface InventoryItem {
  id: string;
  totalQuantity: number;
  product: {
    name: string;
    sku: string;
    reorderLevel: number;
    sellingPrice: string;
  };
}

interface InventoryReportTablesProps {
  lowStock: InventoryItem[];
  outOfStock: InventoryItem[];
  lowStockPagination: {
    page: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

const InventoryReportTables: React.FC<InventoryReportTablesProps> = ({ 
    lowStock, 
    outOfStock,
    lowStockPagination
}) => {

  const lowStockColumns: ColumnDef<InventoryItem>[] = [
    {
        header: "Product",
        accessorKey: "product.name",
        meta: { align: 'left' },
        cell: ({ row }) => (
            <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{row.original.product.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">{row.original.product.sku}</p>
            </div>
        )
    },
    {
        header: "Qty",
        accessorKey: "totalQuantity",
        cell: ({ row }) => (
            <span className="text-sm font-black text-rose-600">{formatNumberShort(row.original.totalQuantity)}</span>
        )
    },
    {
        header: "Limit",
        accessorKey: "product.reorderLevel",
        meta: { align: 'right' },
        cell: ({ row }) => (
            <span className="text-[10px] font-black text-slate-400 uppercase">{formatNumberShort(row.original.product.reorderLevel)} units</span>
        )
    }
  ];

  const outOfStockColumns: ColumnDef<InventoryItem>[] = [
    {
        header: "Product",
        accessorKey: "product.name",
        meta: { align: 'left' },
        cell: ({ row }) => (
            <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{row.original.product.name}</p>
        )
    },
    {
        header: "SKU",
        accessorKey: "product.sku",
        meta: { align: 'right' },
        cell: ({ row }) => (
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{row.original.product.sku}</span>
        )
    }
  ];

  const EmptyState = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
      <Icon className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-3" />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{title}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Out of Stock Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-900/30 shadow-sm">
            <XCircle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Out of Stock</h3>
            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Immediate Attention Required</p>
          </div>
        </div>

        {outOfStock.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
            <DataTable 
                columns={outOfStockColumns}
                data={outOfStock}
                pageSize={100} // Out of stock is usually small, or we could paginate it too
                hidePagination={true}
            />
          </div>
        ) : (
          <EmptyState title="All products in stock" icon={Package} />
        )}
      </div>

      {/* Low Stock Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-900/30 shadow-sm">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Low Stock Alerts</h3>
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Approaching Reorder Level</p>
          </div>
        </div>

        {lowStock.length > 0 || lowStockPagination.total > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
            <DataTable 
                columns={lowStockColumns}
                data={lowStock}
                totalItems={lowStockPagination.total}
                pageSize={5}
                pageIndex={lowStockPagination.page}
                manualPagination={true}
                onPageChange={lowStockPagination.onPageChange}
                hidePagination={false}
            />
          </div>
        ) : (
          <EmptyState title="No low stock alerts" icon={Package} />
        )}
      </div>
    </div>
  );
};

export default InventoryReportTables;
