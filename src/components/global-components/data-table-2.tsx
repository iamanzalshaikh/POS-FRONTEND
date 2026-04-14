"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type {
    ColumnFiltersState,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import * as XLSX from "xlsx"
import { cn } from "@/lib/utils"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Search, Filter, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    placeholder?: string
    headerActions?: React.ReactNode
    children?: React.ReactNode
    onRefresh?: () => void
    pageCount?: number
    pageIndex?: number
    onPageChange?: (index: number) => void
    manualPagination?: boolean
    totalItems?: number
    exportFilename?: string
    onExport?: (data: TData[]) => void
    isLoading?: boolean
    hidePagination?: boolean
    maxHeight?: string
    pageSize?: number
}

function DataTableComponent<TData, TValue>({
    columns,
    data,
    searchKey,
    placeholder = "Search...",
    headerActions,
    children,
    onRefresh,
    pageCount,
    pageIndex,
    onPageChange,
    manualPagination,
    totalItems,
    exportFilename = "Table-Export",
    onExport,
    isLoading = false,
    hidePagination = true,
    maxHeight = "600px",
    pageSize = 10
}: DataTableProps<TData, TValue>) {
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    const handleRefresh = () => {
        if (!onRefresh) return
        setIsRefreshing(true)
        onRefresh()
        setTimeout(() => setIsRefreshing(false), 800)
    }

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: (manualPagination || hidePagination) ? undefined : getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        manualPagination: manualPagination,
        pageCount: pageCount,
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: hidePagination ? 100000 : pageSize,
            },
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            ...((manualPagination || !hidePagination) && {
                pagination: {
                    pageIndex: (pageIndex ?? 1) - 1,
                    pageSize: pageSize,
                },
            }),
        },
    })

    const exportToExcel = () => {
        const rowsToExport = table.getFilteredRowModel().rows
        const visibleColumns = table.getVisibleFlatColumns().filter(col => 
            col.id !== "actions" && 
            col.id !== "select" && 
            (!!col.columnDef.header || !!col.id)
        )
        
        const dataToExport = rowsToExport.map(row => {
            const rowData: Record<string, any> = {}
            visibleColumns.forEach(col => {
                // Better header extraction
                let header = col.id;
                if (typeof col.columnDef.header === 'string') {
                    header = col.columnDef.header;
                } else if (col.id) {
                    // Convert camelCase or dot.notation to Title Case
                    header = col.id
                        .split(/[._]/)
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }
                
                let value = row.getValue(col.id)
                
                // Better data extraction for common objects
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    value = (value as any).name || (value as any).fullName || (value as any).title || JSON.stringify(value)
                } else if (Array.isArray(value)) {
                    if (value.length > 0 && (typeof value[0] === 'string' || typeof value[0] === 'number')) {
                        value = value.join(", ");
                    } else {
                        value = value.length.toString();
                    }
                }

                // Format numbers for better Excel display (handles high-precision strings from DB)
                if (typeof value === 'string' && value.includes('.') && !isNaN(Number(value))) {
                    const num = Number(value);
                    value = Number(num.toFixed(2));
                } else if (typeof value === 'string' && /^\d+$/.test(value)) {
                    // Keep integer strings as numbers if they don't have leading zeros
                    if (value.length === 1 || value[0] !== '0') {
                        value = Number(value);
                    }
                }
                
                rowData[header] = value
            })
            return rowData
        })
        
        if (onExport) {
            onExport(data)
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export")
        XLSX.writeFile(workbook, `${exportFilename}-${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="w-full space-y-4">
            {/* Toolbar row: search + headerActions | refresh + columns */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                    {searchKey && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                placeholder={placeholder}
                                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn(searchKey)?.setFilterValue(event.target.value)
                                }
                                className="pl-10 h-11 border-input bg-background/50 text-foreground shadow-sm focus:ring-primary/20 rounded-xl font-bold"
                            />
                        </div>
                    )}
                    {headerActions}
                </div>
            <div className="flex items-center gap-2">
                    {onRefresh && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            className="h-9 w-9 p-0"
                            title="Refresh data"
                        >
                            <RefreshCw className={`h-4 w-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToExcel}
                        className="h-10 border-input bg-background shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100"
                        title="Export to Excel"
                    >
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-800 bg-background shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl px-5">
                                <Filter className="h-3.5 w-3.5" />
                                Columns <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50 min-w-[8rem] overflow-hidden rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="relative flex cursor-default select-none items-center rounded-xl py-3 px-3 text-[10px] font-black uppercase tracking-widest outline-none transition-colors focus:bg-slate-50 dark:focus:bg-slate-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer data-[state=checked]:text-blue-600"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table wrapper with vertical scroll */}
            <div className="rounded-2xl border-none shadow-none bg-card relative">
                <div 
                    className="overflow-auto custom-scrollbar"
                    style={hidePagination ? { maxHeight: maxHeight } : undefined}
                >
                    <Table>
                        <TableHeader className={cn("bg-card/95 backdrop-blur-sm border-b border-border transition-colors", hidePagination && "sticky top-0 z-30")}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="bg-muted/50">
                                    {headerGroup.headers.map((header) => {
                                        const align = (header.column.columnDef.meta as any)?.align || 'center';
                                        return (
                                            <TableHead 
                                                key={header.id} 
                                                className={cn(
                                                    "bg-slate-50/80 dark:bg-slate-800/80 font-black uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400 py-4 px-4 transition-colors border-y border-slate-100 dark:border-slate-800",
                                                    align === 'center' && "text-center",
                                                    align === 'right' && "text-right",
                                                    align === 'left' && "text-left",
                                                    (header.column.columnDef.meta as any)?.className
                                                )}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(10)].map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((_, j) => (
                                        <TableCell key={j} className="py-4 text-center">
                                            <Skeleton className="h-5 w-full rounded-lg" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const align = (cell.column.columnDef.meta as any)?.align || 'center';
                                        return (
                                            <TableCell 
                                                key={cell.id} 
                                                className={cn(
                                                    "font-medium text-muted-foreground py-3 px-4 transition-all",
                                                    align === 'center' && "text-center",
                                                    align === 'right' && "text-right",
                                                    align === 'left' && "text-left",
                                                    (cell.column.columnDef.meta as any)?.className
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>

            {/* Footer: page info + pagination (only if enabled or manual) */}
            {(!hidePagination || manualPagination) && (
                <div className="flex items-center justify-end space-x-2 py-2">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {(() => {
                            if (manualPagination) {
                                const from = ((pageIndex ?? 1) - 1) * pageSize + 1
                                const to = Math.min((pageIndex ?? 1) * pageSize, totalItems ?? 0)
                                return `Showing ${from}–${to} of ${totalItems ?? 0} results (Page ${pageIndex} of ${pageCount})`
                            }
                            const state = table.getState()
                            const pageIndexInternal = state.pagination?.pageIndex ?? 0
                            const pageSizeInternal = state.pagination?.pageSize ?? pageSize
                            const total = table.getFilteredRowModel().rows.length
                            const from = total === 0 ? 0 : pageIndexInternal * pageSizeInternal + 1
                            const to = Math.min((pageIndexInternal + 1) * pageSizeInternal, total)
                            return `Showing ${from}–${to} of ${total} results`
                        })()}
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => manualPagination ? onPageChange?.((pageIndex ?? 1) - 1) : table.previousPage()}
                            disabled={manualPagination ? (pageIndex ?? 1) <= 1 : !table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => manualPagination ? onPageChange?.((pageIndex ?? 1) + 1) : table.nextPage()}
                            disabled={manualPagination ? (pageIndex ?? 1) >= (pageCount ?? 1) : !table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {children}
        </div>
    )
}

export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent