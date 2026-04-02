import { useState } from "react"
import InventoryHeader from "@/components/store-admin/InventoryHeader"
import InventoryFilters from "@/components/store-admin/InventoryFilters"
import InventoryTable from "@/components/store-admin/InventoryTable"
import { useQuery } from '@tanstack/react-query';
import { fetchFullInventory } from "@/api/inventory.api";

export interface InventoryMovement {
  id: string
  productName: string
  sku: string
  image: string
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

  // React Query Hook
  const { data: inventoryDataRes, isLoading: loading } = useQuery({
    queryKey: ['inventory', { lowStock: false }],
    queryFn: fetchFullInventory,
  });

  const movementsRaw = (inventoryDataRes as any)?.data || (Array.isArray(inventoryDataRes) ? inventoryDataRes : []);
  const movements: InventoryMovement[] = movementsRaw;

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
      <InventoryTable movements={filteredMovements} loading={loading} />
    </div>
  )
}

export default InventoryManagementPage
