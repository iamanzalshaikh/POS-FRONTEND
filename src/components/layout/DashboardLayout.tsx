import React from 'react';
import MainSidebar from './MainSidebar';
import { useSidebar } from '@/components/ui/sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';

interface MenuItem {
    name: string;
    icon: any;
    path: string;
    children?: { name: string; icon?: any; path: string }[];
}

interface DashboardLayoutProps {
  menuItems: MenuItem[];
  children: React.ReactNode;
  title: string;
  subtitle: string;
  role: string;
  accentColor?: string;
  headerExtra?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  menuItems, 
  children, 
  title, 
  subtitle, 
  role,
  accentColor,
  headerExtra
}) => {
  const { collapsed } = useSidebar();
  const portalLabel = `${role.replace('_', ' ')} Portal`;
  void accentColor;

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors duration-500 selection:bg-indigo-100 selection:text-indigo-900">
      
      <MainSidebar menuItems={menuItems} roleName={role} />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <TopNavbar portalLabel={portalLabel} branchLabel={title} />

        <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-[#F7F9FC] dark:bg-slate-950 transition-colors duration-500 custom-scrollbar uppercase">
          {subtitle && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
              {headerExtra}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};


export default DashboardLayout;
