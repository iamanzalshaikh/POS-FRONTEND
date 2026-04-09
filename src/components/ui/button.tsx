import React from 'react'

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }> = ({ children, className, ...rest }) => {
  return (
    <button {...rest} className={className}>
      {children}
    </button>
  )
}

export default Button
