import React, { useState, useRef, useEffect, createContext, useContext } from 'react'

const DropdownContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });

export const DropdownMenu: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" ref={containerRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export const DropdownMenuTrigger: React.FC<{ asChild?: boolean; children?: React.ReactNode }> = ({ children }) => {
  const { open, setOpen } = useContext(DropdownContext);
  return (
    <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="cursor-pointer">
      {children}
    </div>
  );
}

export const DropdownMenuContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className }) => {
  const { open } = useContext(DropdownContext);
  if (!open) return null;

  return (
    <div 
      className={`absolute right-0 top-full mt-3 z-[999] bg-white dark:bg-slate-900 border-[1.5px] border-slate-950 rounded-2xl shadow-2xl p-2 min-w-[14rem] animate-in fade-in slide-in-from-top-4 duration-300 ${className || ''}`}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
    >
      {children}
    </div>
  );
}

export const DropdownMenuCheckboxItem: React.FC<{
  checked?: boolean
  onCheckedChange?: (v?: boolean) => void
  children?: React.ReactNode
  className?: string
}> = ({ checked, onCheckedChange, children, className }) => (
  <label className={`flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer ${className || ''}`}>
    <input type="checkbox" checked={!!checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
    <span className="text-sm font-medium">{children}</span>
  </label>
)

export const DropdownMenuItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, onClick, ...props }) => {
  const { setOpen } = useContext(DropdownContext);
  return (
    <button 
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        setOpen(false); // Close menu on click
      }}
      className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-xs font-black uppercase tracking-widest flex items-center gap-3 border border-transparent hover:border-slate-100 ${className || ''}`}
    >
      {children}
    </button>
  );
}

export default DropdownMenu