import { useState, useEffect } from "react"
import SalesHeader from "@/components/store-admin/SalesHeader"
import SalesFilters from "@/components/store-admin/SalesFilters"
import SalesTable from "@/components/store-admin/SalesTable"
import Sidebar from '@/components/store-admin/Sidebar'
import TopNavbar from '@/components/store-admin/TopNavbar'

import { getSalesTransactions, cancelSale, refundSale } from "@/api/sales.api"

const SalesTransactionsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filters state
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const [salesRes, setSalesRes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSales = async (queryParams: any) => {
    setLoading(true);
    try {
      const data = await getSalesTransactions(queryParams);
      setSalesRes(data);
    } catch (error) {
      console.error("Failed to fetch sales transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const params: any = { page, limit }
  if (search) params.search = search
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate

  if (paymentStatus && paymentStatus !== "All Statuses") {
    if (paymentStatus === "Completed") params.paymentStatus = "COMPLETED"
    if (paymentStatus === "Pending") params.paymentStatus = "FAILED"
    if (paymentStatus === "Refunded") params.paymentStatus = "REFUNDED"
  }

  useEffect(() => {
    loadSales(params);
  }, [page, search, startDate, endDate, paymentStatus, paymentMethod]);

  const transactions = salesRes?.data || (Array.isArray(salesRes) ? salesRes : []);
  const total = salesRes?.total || transactions.length;

  const handleCancelSale = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this sale?")) return;
    try {
      await cancelSale(id, "Cancelled by admin")
      await loadSales(params);
    } catch (err) {
      console.error("Failed to cancel sale", err)
      alert("Failed to cancel sale")
    }
  }

  const handleRefundSale = async (id: string) => {
    if (!window.confirm("Are you sure you want to refund this sale?")) return;
    try {
      await refundSale(id, "Refunded by admin")
      await loadSales(params);
    } catch (err) {
      console.error("Failed to refund sale", err)
      alert("Failed to refund sale")
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 transition-colors duration-500 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 md:p-8 lg:p-10 w-full animate-fade-in space-y-6">
          <SalesHeader
            onDateRangeChange={(start, end) => {
              setStartDate(start)
              setEndDate(end)
              setPage(1)
            }}
          />
          <SalesFilters
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            status={paymentStatus}
            onStatusChange={(v) => { setPaymentStatus(v); setPage(1); }}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(v) => { setPaymentMethod(v); setPage(1); }}
            dateRange={{ start: startDate, end: endDate }}
            onDateRangeChange={(start, end) => {
              setStartDate(start)
              setEndDate(end)
              setPage(1)
            }}
          />
          <SalesTable
            transactions={transactions}
            loading={loading}
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onCancel={handleCancelSale}
            onRefund={handleRefundSale}
          />
        </main>
      </div>
    </div>
  )
}

export default SalesTransactionsPage
