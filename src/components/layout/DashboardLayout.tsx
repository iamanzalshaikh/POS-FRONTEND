import React, { useState } from 'react';
import { LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { ModeToggle } from '../mode-toggle';

interface DashboardLayoutProps {
  sidebarContent: React.ReactNode;
  children: React.ReactNode;
  title: string;
  subtitle: string;
  role: string;
  accentColor?: string;
  headerExtra?: React.ReactNode;
}

// Adding a context or just cloning children if needed for isCollapsed, 
// but it's easier to just use CSS group-hover or pass it if you control the sidebarContent.
// For simplicity, we'll wrap the sidebar in a stateful component here.

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  sidebarContent, 
  children, 
  title, 
  subtitle, 
  role,
  accentColor = 'indigo',
  headerExtra
}) => {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const accentStyles: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const avatarStyles: Record<string, string> = {
    indigo: 'bg-indigo-600 text-white',
    purple: 'bg-purple-600 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-600 text-white',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sliding Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[#262255] border-r border-[#2A2760]/20 flex flex-col shadow-xl z-50 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Toggle Button (Desktop) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-[#2A2760] border border-[#262255]/20 rounded-full items-center justify-center text-white hover:bg-[#262255] shadow-sm z-50"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        {/* We wrap the sidebarContent in a div with a custom data attribute or CSS class to let the inner items know if they should show labels */}
        <div className={`flex-1 overflow-y-auto p-4 flex flex-col ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
           <div className="flex-1">
             {/* Note: In a real app we'd pass isSidebarOpen via Context, but for this quick fix we'll use CSS to hide/show text based on the parent class */}
             <div className="sidebar-container">
               {sidebarContent}
             </div>
           </div>

           <button 
            onClick={logout}
            className={`mt-auto flex items-center ${isSidebarOpen ? 'justify-start space-x-3 px-3' : 'justify-center'} py-3 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all font-medium`}
            title="Logout"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}
        `}
      >
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm transition-colors">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium hidden sm:block mt-1">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {headerExtra}
            <div className={`${accentStyles[accentColor]} px-3 py-1 lg:px-4 lg:py-1.5 rounded-full text-[10px] lg:text-xs tracking-wide font-bold border uppercase shadow-sm`}>
              {(role || 'USER').replace('_', ' ')}
            </div>
            <div className={`${avatarStyles[accentColor]} w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center font-bold shadow-md shadow-${accentColor}-500/20`}>
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`} alt="User avatar" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 flex-1 overflow-auto bg-slate-50 dark:bg-slate-950/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
