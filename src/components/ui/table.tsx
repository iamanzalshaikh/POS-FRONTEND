import React from 'react'

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, className, ...rest }) => (
  <table {...rest} className={`${className ?? ''} w-full table-auto border-collapse`}>{children}</table>
)

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className }) => (
  <thead className={className}>{children}</thead>
)

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className }) => (
  <tbody className={className}>{children}</tbody>
)

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...rest }) => (
  <tr className={`${className ?? ''}`} {...rest}>{children}</tr>
)

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...rest }) => (
  <th scope="col" className={`${className ?? 'px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest'} `} {...rest}>{children}</th>
)

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...rest }) => (
  <td className={`${className ?? 'px-6 py-4 align-top text-sm text-slate-700'} `} {...rest}>{children}</td>
)

export default Table
