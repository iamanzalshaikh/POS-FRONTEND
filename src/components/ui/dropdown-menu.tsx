import React from 'react'

export const DropdownMenu: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-block">{children}</div>
)

export const DropdownMenuTrigger: React.FC<{ asChild?: boolean; children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
)

export const DropdownMenuContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className }) => (
  <div className={className}>{children}</div>
)

export const DropdownMenuCheckboxItem: React.FC<{
  checked?: boolean
  onCheckedChange?: (v?: boolean) => void
  children?: React.ReactNode
  className?: string
}> = ({ checked, onCheckedChange, children, className }) => (
  <label className={className} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <input type="checkbox" checked={!!checked} onChange={(e) => onCheckedChange?.(e.target.checked)} />
    <span>{children}</span>
  </label>
)

export const DropdownMenuItem: React.FC<{
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}> = ({ children, className, onClick, disabled }) => (
  <div
    className={className}
    onClick={onClick}
    role="menuitem"
    tabIndex={disabled ? undefined : 0}
    style={{ padding: '8px 12px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
  >
    {children}
  </div>
)

export default DropdownMenu
