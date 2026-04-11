import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import TopNavLink from '../ui/TopNavLink';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Hexagon, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopNavLayoutProps {
  children: React.ReactNode;
  navLinks: { label: string; to: string }[];
}

const TopNavLayout: React.FC<TopNavLayoutProps> = ({ children, navLinks }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Navigation */}
          <div className="flex items-center h-full space-x-8">
            <div className="flex items-center space-x-2 mr-4">
              <div className="w-8 h-8 bg-indigo-950 rounded flex items-center justify-center">
                <Hexagon className="text-white w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">Hybrid POS Admin</span>
            </div>
            
            <nav className="h-full flex items-center space-x-1 hidden md:flex">
              {navLinks.map((link) => (
                <TopNavLink key={link.to} to={link.to} label={link.label} />
              ))}
            </nav>
          </div>

          {/* Search, Actions & Profile */}
          <div className="flex items-center space-x-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search data, stores..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none w-64 placeholder:text-slate-500 font-medium transition-all"
              />
            </div>
            
            <button className="text-slate-500 hover:text-slate-900 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-600 rounded-full border border-white"></span>
            </button>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 outline-none group">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden group-hover:border-indigo-200 transition-all">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=6366f1&color=fff&bold=true`} 
                                alt="User avatar" 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 p-1.5 rounded-xl border-slate-100 shadow-xl">
                    <DropdownMenuLabel className="px-3 py-2">
                        <p className="text-sm font-bold text-slate-900 leading-none">{user?.name || 'Admin'}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1.5">
                            {user?.role?.replace('_', ' ') || 'Management'}
                        </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-600">
                        <User size={18} />
                        <span className="text-sm font-medium">Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-600">
                        <Settings size={18} />
                        <span className="text-sm font-medium">Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-rose-500 focus:bg-rose-50 focus:text-rose-600"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-screen-2xl mx-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default TopNavLayout;
