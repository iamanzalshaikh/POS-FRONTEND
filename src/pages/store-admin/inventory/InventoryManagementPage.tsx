import InventoryHeader from "@/components/store-admin/InventoryHeader"
import { fetchInventoryLogs } from "@/api/inventory.api";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Search, ShoppingCart, RefreshCw, AlertTriangle, Box, User, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';

export interface InventoryMovement {
  id: string
  productName: string
  sku: string
  image: string | null
  quantityChange: number
  changeType: "sale" | "restock" | "adjustment"
  referenceId: string
  user: string
  timestamp: string
}

const InventoryManagementPage = () => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Movements")

  const [inventoryDataRes, setInventoryDataRes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInventoryLogs({ limit: 50 });
      setInventoryDataRes(data);
    } catch (err: any) {
      console.error("Failed to fetch inventory logs:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const refetch = loadMovements;

  const movementsRaw = (inventoryDataRes as any)?.data || (Array.isArray(inventoryDataRes) ? inventoryDataRes : []);
  const movements: InventoryMovement[] = (movementsRaw as any[]).map((m: any) => ({
    id: m.id,
    productName: m.product?.name || "Unknown Product",
    sku: m.product?.sku || "N/A",
    quantityChange: m.quantityChange,
    changeType: m.changeType,
    referenceId: m.referenceId || m.id.slice(0, 8),
    user: m.user?.name || "System",
    timestamp: new Date(m.createdAt).toLocaleString(),
    image: m.product?.image ? `http://localhost:3005${m.product.image}` : null
  }));

  const columns: ColumnDef<InventoryMovement>[] = [
    {
        header: "Product",
        accessorKey: "productName",
        cell: ({ row }) => (
            <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm">
                    {row.original.image ? (
                        <img src={row.original.image} alt={row.original.productName} className="w-full h-full object-cover" />
                    ) : (
                        <Box size={20} className="text-slate-300" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.productName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">SKU: {row.original.sku}</p>
                </div>
            </div>
        )
    },
    {
        header: "Movement",
        accessorKey: "quantityChange",
        cell: ({ row }) => {
            const change = row.original.quantityChange;
            const isPositive = change > 0;
            return (
                <div className="text-center font-black">
                    <span className={cn(
                        "flex items-center justify-center gap-1.5 text-xs tabular-nums uppercase tracking-widest px-3 py-1 rounded-lg border",
                        isPositive 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
                            : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
                    )}>
                        {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {isPositive ? '+' : ''}{change}
                    </span>
                </div>
            )
        }
    },
    {
        header: "Type",
        accessorKey: "changeType",
        cell: ({ row }) => (
            <div className="text-center">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-[2px]">
                    {row.original.changeType}
                </span>
            </div>
        )
    },
    {
        header: "Reference",
        accessorKey: "referenceId",
        cell: ({ row }) => (
            <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">#{row.original.referenceId}</span>
            </div>
        )
    },
    {
        header: "Operator",
        accessorKey: "user",
        cell: ({ row }) => (
            <div className="flex items-center gap-2 justify-center">
                <User size={12} className="text-slate-300" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{row.original.user}</span>
            </div>
        )
    },
    {
        header: "Timestamp",
        accessorKey: "timestamp",
        cell: ({ row }) => (
            <div className="text-right pr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {row.original.timestamp}
            </div>
        )
    }
  ];

  const filteredMovements = movements.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      m.productName.toLowerCase().includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.referenceId.toLowerCase().includes(q);

    const matchesType = typeFilter === "All Movements" ||
      (typeFilter.toLowerCase() === m.changeType.toLowerCase());

    return matchesSearch && matchesType;
  });

  const totalCount = filteredMovements.length;
  const paginatedMovements = filteredMovements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      <InventoryHeader />
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable 
            columns={columns} 
            data={filteredMovements}
            isLoading={loading}
            onRefresh={loadMovements}
            placeholder="Search movements..."
            headerActions={
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl h-10 px-2">
                        {['All Movements', 'Sale', 'Restock', 'Adjustment'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setTypeFilter(m)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    typeFilter === m
                                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                        : "text-slate-400 hover:text-blue-600"
                                )}
                            >
                                {m === 'All Movements' ? 'All' : m}
                            </button>
                        ))}
                    </div>
                </div>
            }
        />
      </div>
    </div>
  )
}

export default InventoryManagementPage
