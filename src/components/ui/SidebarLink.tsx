import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSidebar } from './sidebar';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, variant = 'indigo' }) => {
  const { collapsed } = useSidebar();

  const variantMap = {
    indigo: 'text-indigo-400 bg-indigo-50/10 border-r-2 border-indigo-500',
    emerald: 'text-emerald-400 bg-emerald-50/10 border-r-2 border-emerald-500',
    amber: 'text-amber-400 bg-amber-50/10 border-r-2 border-amber-500',
    rose: 'text-rose-400 bg-rose-50/10 border-r-2 border-rose-500',
    slate: 'text-slate-400 bg-slate-50/10 border-r-2 border-slate-500',
  };

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-3 transition-all duration-300 group relative ${
          isActive 
            ? variantMap[variant] 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{icon}</div>
      {!collapsed && (
        <span className="font-bold text-sm tracking-tight truncate animate-in fade-in slide-in-from-left-2 duration-300">
          {label}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100] shadow-xl border border-white/5 pointer-events-none">
          {label}
        </div>
      )}
    </NavLink>
  );
};

export default SidebarLink;