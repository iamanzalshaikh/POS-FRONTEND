import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[#262255] text-white hover:bg-indigo-900 shadow-sm',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white',
    outline: 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300',
    ghost: 'hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-400',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px] uppercase tracking-widest',
    md: 'px-5 py-2.5 text-xs uppercase tracking-widest',
    lg: 'px-8 py-4 text-sm uppercase tracking-widest',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button 
      {...props} 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button