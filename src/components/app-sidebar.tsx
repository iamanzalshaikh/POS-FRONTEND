import React from 'react'
import { useLocation } from 'react-router-dom'
import { useSidebar } from '@/components/ui/sidebar'
import SuperAdminSidebar from './layout/SuperAdminSidebar'
import Sidebar from './layout/Sidebar'

export const AppSidebar: React.FC = () => {
  const { collapsed, isMobileOpen, closeMobile } = useSidebar()
  const loc = useLocation()

  const isSuper = loc.pathname.startsWith('/super-admin')

  // Render the right sidebar variant. Pass collapsed state.
  return (
    <>
      {/* Desktop fixed sidebar */}
      {isSuper ? <SuperAdminSidebar collapsed={collapsed} /> : <Sidebar />}

      {/* Mobile drawer: reuse the same components but rendered as overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeMobile} />
          <div className="fixed left-0 top-0 h-full w-64 bg-[#262255] z-70">
            {isSuper ? <SuperAdminSidebar collapsed={false} /> : <Sidebar />}
            <div className="p-4">
              <button onClick={closeMobile} className="text-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AppSidebar
