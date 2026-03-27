import { useEffect, useState } from "react"
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';

import ProductsHeader from "@/components/store-admin/ProductsHeader"
import ProductsFilters from "@/components/store-admin/ProductsFilters"
import ProductsTable from "@/components/store-admin/ProductsTable"
import ProductPagination from "@/components/store-admin/ProductPagination"
import AddProductModal from "@/components/store-admin/AddProductModal"

import { fetchProducts } from "@/api/products.api"
import { fetchFullInventory } from "@/api/inventory.api"
import { getCategories } from "@/api/category.api"
import type { Product } from "./types/product.types"


export default function ProductsManagementPage() {

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [openModal, setOpenModal] = useState(false)

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const limit = 10

    const [search, setSearch] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [isActive, setIsActive] = useState<string>('all')

    const [categories, setCategories] = useState<any[]>([])


    useEffect(() => {
        void loadProducts()
        void loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const res = await getCategories()
            const cats = res.data?.data || (Array.isArray(res.data) ? res.data : [])
            setCategories(cats)
        } catch (error) {
            console.error("Failed to load categories:", error)
        }
    }


    const loadProducts = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (search) params.search = search;
            if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
            if (isActive !== 'all') params.isActive = isActive === 'true';

            const [productsRes, inventoryRes] = await Promise.all([
                fetchProducts(params),
                fetchFullInventory()
            ])


            const productsData = productsRes.data?.data || (Array.isArray(productsRes.data) ? productsRes.data : [])
            const inventoryData = inventoryRes.data?.data || (Array.isArray(inventoryRes.data) ? inventoryRes.data : [])

            // Map inventory by productId
            const inventoryMap = inventoryData.reduce((acc: any, inv: any) => {
                acc[inv.productId] = inv.totalQuantity || inv.stock || 0
                return acc
            }, {})

            // Merge stock into products
            const mergedProducts = productsData.map((p: any) => {
                const stock = inventoryMap[p.id] || 0
                return {
                    ...p,
                    stock: stock,
                    // Optionally update status based on logic
                }
            })

            setProducts(mergedProducts)
        } catch (error) {
            console.error("Failed to fetch products or inventory:", error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const paginated = products.slice((page - 1) * limit, page * limit)
    const total = products.length

    return (

        <div className="min-h-screen bg-[#F7F9FC] transition-colors duration-500 flex text-slate-900">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
                <TopNavbar 
                    onMenuClick={() => setSidebarOpen(true)} 
                />

                <main className="p-4 md:p-8 lg:p-10 w-full animate-fade-in">
                    <ProductsHeader openModal={() => setOpenModal(true)} />

                    <div className="mt-10">
                        <ProductsFilters 
                            search={search}
                            setSearch={setSearch}
                            categoryId={categoryId}
                            setCategoryId={setCategoryId}
                            isActive={isActive}
                            setIsActive={setIsActive}
                            categories={categories}
                            onFilter={loadProducts}
                        />
                    </div>


                    <div className="mt-8">
                        {loading ? (
                            <div className="bg-white rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] animate-pulse mt-6">Syncing Inventory Assets...</p>
                            </div>
                        ) : (
                            <ProductsTable data={paginated} onRefresh={() => loadProducts()} />
                        )}
                    </div>

                    <div className="mt-10">
                        <ProductPagination page={page} setPage={setPage} total={total} />
                    </div>
                </main>
            </div>

            <AddProductModal 
                open={openModal} 
                onClose={() => setOpenModal(false)} 
                onSuccess={() => loadProducts()}
            />

        </div>

    )

}
