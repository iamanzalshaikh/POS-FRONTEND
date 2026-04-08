import { useState, useEffect } from "react"
import InventoryHeader from "@/components/store-admin/InventoryHeader"
import InventoryFilters from "@/components/store-admin/InventoryFilters"
import InventoryTable from "@/components/store-admin/InventoryTable"
import { fetchInventoryLogs } from "@/api/inventory.api";

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
  const [timeFilter, setTimeFilter] = useState("All Time")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5;

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
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        timeFilter={timeFilter}
        onTimeChange={setTimeFilter}
      />
      {error ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <p className="text-[10px] font-black text-rose-500 mb-2 uppercase tracking-[4px]">Stock Link Error</p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{(error as any)?.message || 'Unable to synchronize inventory data.'}</p>
          <button onClick={() => refetch()} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Retry Sync</button>
        </div>
      ) : (
        <InventoryTable 
          movements={paginatedMovements} 
          loading={loading}
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export default InventoryManagementPage
