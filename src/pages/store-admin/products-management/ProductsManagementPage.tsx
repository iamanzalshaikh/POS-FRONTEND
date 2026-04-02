import { useEffect, useState } from "react"

import ProductsHeader from "@/components/store-admin/ProductsHeader"
import ProductsFilters from "@/components/store-admin/ProductsFilters"
import ProductsTable from "@/components/store-admin/ProductsTable"
import ProductPagination from "@/components/store-admin/ProductPagination"
import AddProductModal from "@/components/store-admin/AddProductModal"
import StatsCards from "@/components/global-components/StatsCards"

import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from "@/api/products.api";
import { fetchFullInventory } from "@/api/inventory.api";
import { getCategories } from "@/api/category.api"

export default function ProductsManagementPage() {
    const [openModal, setOpenModal] = useState(false)

    const [page, setPage] = useState(1)
    const limit = 10

    const [search, setSearch] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [isActive, setIsActive] = useState<string>('all')

    const [categories, setCategories] = useState<any[]>([])

    // Load categories (can be optimized with useQuery later if needed, but for now matching existing loadCategories pattern)
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await getCategories()
                const cats = res.data?.data || (Array.isArray(res.data) ? res.data : [])
                setCategories(cats)
            } catch (error) {
                console.error("Failed to load categories:", error)
            }
        }
        void loadCategories()
    }, [])

    const queryParams: any = {}
    if (search) queryParams.search = search;
    if (categoryId && categoryId !== 'all') queryParams.categoryId = categoryId;
    if (isActive !== 'all') queryParams.isActive = isActive === 'true';

    // React Query Hooks
    const { data: productsDataRes, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
        queryKey: ['products', queryParams],
        queryFn: () => fetchProducts(queryParams),
    });
    const { data: inventoryDataRes, isLoading: inventoryLoading } = useQuery({
        queryKey: ['inventory', { lowStock: false }],
        queryFn: fetchFullInventory,
    });

    const loading = productsLoading || inventoryLoading;

    // Merge Logic
    const getMergedProducts = () => {
        const productsRaw = productsDataRes?.data || (Array.isArray(productsDataRes) ? productsDataRes : [])
        const inventoryRaw = inventoryDataRes?.data || (Array.isArray(inventoryDataRes) ? inventoryDataRes : [])

        const inventoryMap = inventoryRaw.reduce((acc: any, inv: any) => {
            acc[inv.productId] = inv.totalQuantity || inv.stock || 0
            return acc
        }, {})

        return productsRaw.map((p: any) => ({
            ...p,
            stock: inventoryMap[p.id] || 0
        }))
    }

    const products = getMergedProducts()
    const paginated = products.slice((page - 1) * limit, page * limit)
    const total = products.length

    return (
        <div className="animate-in fade-in duration-500">
            <ProductsHeader openModal={() => setOpenModal(true)} />

            <div className="mt-8">
                <StatsCards data={[
                    { name: "Total Products", stat: String(total), change: "+2.5%", changeType: "positive" },
                    { name: "Categories", stat: String(categories.length), change: "0%", changeType: "positive" },
                    { name: "Out of Stock", stat: String(products.filter((p: any) => p.stock <= 0).length), change: "-5%", changeType: "negative" },
                    { name: "Low Stock", stat: String(products.filter((p: any) => p.stock > 0 && p.stock <= 10).length), change: "+1.2%", changeType: "negative" },
                ]} />
            </div>

            <div className="mt-10">
                <ProductsFilters
                    search={search}
                    setSearch={setSearch}
                    categoryId={categoryId}
                    setCategoryId={setCategoryId}
                    isActive={isActive}
                    setIsActive={setIsActive}
                    categories={categories}
                    onFilter={refetchProducts}
                />
            </div>

            <div className="mt-8">
                {loading ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                        <div className="w-12 h-12 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] animate-pulse mt-6">Syncing Inventory Assets...</p>
                    </div>
                ) : (
                    <ProductsTable data={paginated} onRefresh={() => refetchProducts()} />
                )}
            </div>

            <div className="mt-10">
                <ProductPagination page={page} setPage={setPage} total={total} />
            </div>

            <AddProductModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSuccess={() => refetchProducts()}
            />
        </div>
    )
}
