import { Download, Monitor } from "lucide-react"

interface DevicesHeaderProps {
  onAddTerminal?: () => void;
  terminalCount?: number;
}

export default function DevicesHeader({ onAddTerminal, terminalCount = 0 }: DevicesHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in px-2">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terminals Management</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {terminalCount} {terminalCount === 1 ? 'terminal' : 'terminals'} registered · Monitor and manage all POS terminals
                </p>
            </div>

            <div className="flex items-center gap-4">
                {onAddTerminal && (
                    <button
                        onClick={onAddTerminal}
                        className="flex items-center gap-3 px-8 py-3.5 bg-[#1E1B4B] border border-[#1E1B4B]/20 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#2563EB] shadow-lg shadow-[#1E1B4B]/20 transition-all active:scale-95"
                    >
                        <Monitor className="w-4 h-4" strokeWidth={3} />
                        Add New Terminal
                    </button>
                )}
            </div>
        </div>
    )
}
