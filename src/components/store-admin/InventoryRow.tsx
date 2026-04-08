import { Box } from 'lucide-react';
import type { InventoryMovement } from "@/pages/store-admin/inventory/InventoryManagementPage"

interface Props {
  movement: InventoryMovement
  index: number
}

const InventoryRow = ({ movement, index }: Props) => {
  const quantityColor =
    movement.quantityChange > 0
      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
      : "text-rose-600 bg-rose-50 border-rose-100"

  const changeTypeBadge = () => {
    const type = (movement.changeType || "").toLowerCase();
    switch (type) {
      case "sale":
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-medium uppercase tracking-widest leading-tight whitespace-nowrap">Sale</span>;
      case "purchase":
      case "restock":
        return <span className="px-2.5 py-1 bg-indigo-600/5 text-indigo-600 border border-indigo-600/10 rounded-lg text-[10px] font-medium uppercase tracking-widest leading-tight whitespace-nowrap">Stock In</span>;
      case "adjustment":
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest leading-tight whitespace-nowrap">Adjustment</span>;
      case "opening_stock":
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest leading-tight whitespace-nowrap">Opening</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-medium uppercase tracking-widest leading-tight whitespace-nowrap">{movement.changeType}</span>;
    }
  }

  return (
    <tr className="border-b-2 border-black last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300 group cursor-pointer">
      <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
        {index.toString().padStart(2, '0')}
      </td>
      <td className="px-6 py-4 text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-indigo-600/20 transition-colors shrink-0">
            {movement.image ? (
                <img
                    src={movement.image}
                    alt={movement.productName}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600">
                    <Box size={20} strokeWidth={1.5} />
                </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
              {movement.productName}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[2px] mt-0.5 truncate leading-none">
              SKU: {movement.sku}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 border-l-0 text-left">
        <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest tabular-nums border ${quantityColor}`}>
          {movement.quantityChange > 0 ? "+" : ""}
          {movement.quantityChange}
        </span>
      </td>
      <td className="px-6 py-4 capitalize text-left">
        {changeTypeBadge()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-tight shadow-sm">
            {movement.user ? movement.user.charAt(0) : "U"}
          </div>
          <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest whitespace-nowrap">{movement.user}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 tabular-nums uppercase tracking-widest whitespace-nowrap text-left">
        {movement.timestamp}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-all p-2.5 rounded-2xl active:scale-95 shadow-sm border border-transparent hover:border-indigo-600/10 dark:hover:border-indigo-600/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </td>
    </tr>
  )
}

export default InventoryRow
