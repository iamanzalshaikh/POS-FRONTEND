import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useSidebar } from '@/components/ui/sidebar';

export default function TopNavbar() {
    const { collapsed, toggle, openMobile } = useSidebar();

    return (
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between shadow-sm shadow-slate-100/50 dark:shadow-none transition-colors duration-300">
            <div className="flex items-center gap-4 sm:gap-6">
                <button
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            openMobile();
                        } else {
                            toggle();
                        }
                    }}
                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
                </button>
                
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-widest uppercase hidden md:block">
                    Store Admin Portal
                </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <ModeToggle />
                </div>

                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-2"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">MAIN BRANCH</p>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200"></span>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase">ONLINE</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
