import React, { createContext, useContext, useEffect, useState } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (v: boolean) => void
  toggle: () => void
  openMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('superadmin_sidebar_collapsed') === 'true'
    } catch (e) {
      return false
    }
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('superadmin_sidebar_collapsed', String(collapsed)) } catch (e) {}
  }, [collapsed])

  const toggle = () => setCollapsed(prev => !prev)
  const openMobile = () => setIsMobileOpen(true)
  const closeMobile = () => setIsMobileOpen(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobileOpen, setIsMobileOpen, toggle, openMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}

export const SidebarTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const { toggle, openMobile } = useSidebar()
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // On narrow screens, open mobile drawer instead
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      openMobile()
    } else {
      toggle()
    }
    props.onClick?.(e)
  }

  return (
    <button {...props} onClick={onClick} aria-label="Toggle sidebar">
      {props.children}
    </button>
  )
}