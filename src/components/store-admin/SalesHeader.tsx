import React from "react"
import { Bell, Download } from "lucide-react"

interface Props {
  onDateRangeChange: (start: string, end: string) => void
}

const SalesHeader: React.FC<Props> = ({ onDateRangeChange }) => {
  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === "Oct 1 - Oct 31, 2023") {
      onDateRangeChange("2023-10-01", "2023-10-31")
    } else if (val === "Last 7 Days") {
      const start = new Date()
      start.setDate(start.getDate() - 7)
      onDateRangeChange(start.toISOString().split('T')[0], new Date().toISOString().split('T')[0])
    } else if (val === "This Month") {
      const start = new Date()
      start.setDate(1)
      onDateRangeChange(start.toISOString().split('T')[0], new Date().toISOString().split('T')[0])
    } else {
      onDateRangeChange("", "")
    }
  }

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800">Sales Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and monitor your recent store sales and order history accurately.</p>
      </div>
      <div className="flex items-center gap-4">
        <select 
          onChange={handleDateSelect}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-4 focus:ring-[#2563EB]/5 focus:border-[#2563EB]/30 bg-white text-slate-600 cursor-pointer appearance-none pr-8 transition-all"
        >
          <option value="">All Time</option>
          <option value="Oct 1 - Oct 31, 2023">Oct 1 - Oct 31, 2023</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="This Month">This Month</option>
        </select>
        <div className="w-px h-8 bg-gray-200 mx-2"></div>
        <button className="p-2 text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 rounded-xl transition-all relative border border-transparent hover:border-[#2563EB]/10">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </div>
  )
}

export default SalesHeader
