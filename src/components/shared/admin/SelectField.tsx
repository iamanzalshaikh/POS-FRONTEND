import React from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  registration?: any;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ 
  label, 
  error, 
  registration, 
  options,
  className = "", 
  ...props 
}) => {
  return (
    <div className="w-full space-y-1.5 focus-within:z-10 relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">
        {label}
      </label>
      <select
        {...registration}
        {...props}
        className={`w-full px-5 py-3.5 bg-slate-50/50 border-2 ${
          error ? 'border-rose-500/50' : 'border-slate-100'
        } rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer ${className}`}
      >
        <option value="">{props.placeholder || 'Select Option'}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <span className="text-[10px] font-bold text-rose-500 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
      
      {/* Custom dropdown arrow */}
      <div className="absolute right-5 top-[38px] pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
};

export default SelectField;
