import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'indigo' | 'purple' | 'amber' | 'emerald' | 'navy';
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  icon, 
  label, 
  to,
  onClick,
  variant: _variant = 'navy'
}) => {
  const variantStyles = {
    indigo: 'bg-[#2A2760] shadow-lg shadow-indigo-900/30 text-white',
    purple: 'bg-[#2A2760] shadow-lg shadow-indigo-900/30 text-white',
    amber: 'bg-[#2A2760] shadow-lg shadow-indigo-900/30 text-white',
    emerald: 'bg-[#2A2760] shadow-lg shadow-indigo-900/30 text-white',
    navy: 'bg-[#2A2760] shadow-lg shadow-indigo-900/30 text-white'
  };

  const baseClasses = "flex items-center px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden group";

  if (to) {
    return (
      <NavLink
        to={to}
        onClick={onClick}
        title={label}
        end
        className={({ isActive }) =>
          `${baseClasses} ${
            isActive
              ? `${variantStyles.navy}`
              : 'text-slate-300 hover:text-white hover:bg-[#2A2760]'
          }`
        }
      >
        {({ isActive }) => (
          <div className="flex items-center space-x-3 w-full">
             <div className={`flex-shrink-0 flex items-center justify-center w-6 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{icon}</div>
             <span className="sidebar-label whitespace-nowrap transition-all duration-300 ease-in-out font-bold tracking-wide text-sm">{label}</span>
          </div>
        )}
      </NavLink>
    );
  }

  return (
    <div
      onClick={onClick}
      title={label}
      className={`${baseClasses} text-slate-300 hover:text-white hover:bg-[#2A2760]`}
    >
      <div className="flex items-center space-x-3 w-full">
        <div className="flex-shrink-0 flex items-center justify-center w-6 text-slate-400 group-hover:text-white transition-colors">{icon}</div>
        <span className="sidebar-label whitespace-nowrap transition-all duration-300 ease-in-out font-bold tracking-wide text-sm">{label}</span>
      </div>
    </div>
  );
};

export default SidebarLink;
