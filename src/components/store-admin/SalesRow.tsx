import React, { useState, useRef, useEffect } from "react"
import type { SaleTransaction } from "@/types/sales"
import { getSaleGrandTotal, getSaleTaxTotal } from "@/utils/saleAmounts"

interface Props {
  transaction: SaleTransaction
  index: number
  onCancel: () => void
  onRefund: () => void
}

const SalesRow: React.FC<Props> = ({ transaction, index, onCancel, onRefund }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const statusColor: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    FAILED: "bg-rose-100 text-rose-700 border-rose-200",
    REFUNDED: "bg-slate-100 text-slate-700 border-slate-200"
  }

  const statusLabel = (raw?: string) => {
    if (!raw) return "Unknown";
    const s = raw.toUpperCase();
    if (s === "COMPLETED") return "Completed";
    if (s === "PENDING") return "Pending";
    if (s === "FAILED" || s === "CANCELLED") return "Failed";
    if (s === "REFUNDED") return "Refunded";
    return raw;
  }

  const formattedDate = transaction.createdAt 
    ? new Date(transaction.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : transaction.date || "N/A";

  const grandTotal = getSaleGrandTotal(transaction)
  const taxTotal = getSaleTaxTotal(transaction)

  return (
    <tr className="border-b hover:bg-slate-50 transition-all duration-300 group cursor-pointer border-slate-100">
      <td className="p-4 font-mono text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">
        {index.toString().padStart(2, '0')}
      </td>
      <td className="p-4 text-slate-600 text-[13px] font-medium whitespace-nowrap">
        {formattedDate}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50/50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-[11px] font-black uppercase shrink-0 shadow-sm">
            {transaction.customer && transaction.customer !== "Guest" ? transaction.customer.charAt(0) : "G"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{transaction.customer || "Guest Checkout"}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{transaction.invoiceNumber}</span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col items-start">
          <span className="font-black text-slate-900 tracking-tight">₨ {grandTotal.toFixed(2)}</span>
          {taxTotal > 0 && (
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[1px]">GST ₨ {taxTotal.toFixed(2)}</span>
          )}
          {transaction._count?.saleItems && (
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[1px]">{transaction._count.saleItems} Items</span>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col items-start group-hover:scale-105 transition-transform origin-left">
           <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
            {transaction.paymentMethod || "CASH"}
          </span>
        </div>
      </td>
      <td className="p-4">
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColor[transaction.status?.toUpperCase() || transaction.paymentStatus?.toUpperCase() || ""] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
          {statusLabel(transaction.status || transaction.paymentStatus)}
        </span>
      </td>
      <td className="p-4 relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-xl hover:bg-white border border-transparent hover:border-indigo-600/10 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 font-medium text-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 border-b border-slate-50 mb-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Management</p>
            </div>
            <button
              onClick={() => { setMenuOpen(false); onCancel(); }}
              className="w-full text-left px-4 py-2 hover:bg-rose-50 transition-colors text-slate-700 hover:text-rose-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              Cancel Sale
            </button>
            <button
              onClick={() => { setMenuOpen(false); onRefund(); }}
              className="w-full text-left px-4 py-2 hover:bg-amber-50 transition-colors text-slate-700 hover:text-amber-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              Refund Sale
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default SalesRow
