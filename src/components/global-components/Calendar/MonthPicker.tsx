import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
  value?: string // YYYY-MM
  onChange: (value: string) => void
  className?: string
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [currentYear, setCurrentYear] = React.useState(() => {
    if (value) return parseInt(value.split('-')[0])
    return new Date().getFullYear()
  })

  const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : -1
  const selectedYear = value ? parseInt(value.split('-')[0]) : -1

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handleMonthSelect = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, '0')
    onChange(`${currentYear}-${month}`)
  }

  const handlePrevYear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentYear(prev => prev - 1)
  }

  const handleNextYear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentYear(prev => prev + 1)
  }

  const displayValue = value ? (() => {
    const [y, m] = value.split('-')
    return `${months[parseInt(m) - 1]} ${y}`
  })() : "Filter by month"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-11 border-input bg-background/50 rounded-xl w-full font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all justify-start px-3",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {displayValue}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-3 bg-card border-border" align="start">
        <div className="flex items-center justify-between mb-4 px-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={handlePrevYear}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-xs font-black uppercase tracking-widest text-foreground">
            {currentYear}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={handleNextYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => {
            const isSelected = selectedYear === currentYear && selectedMonth === index
            return (
              <Button
                key={month}
                variant="ghost"
                className={cn(
                  "h-9 text-[10px] font-black uppercase tracking-tight transition-all",
                  isSelected 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month.slice(0, 3)}
              </Button>
            )
          })}
        </div>
        <DropdownMenuSeparator className="my-2" />
        <Button
          variant="ghost"
          className="w-full h-8 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          onClick={() => onChange("")}
        >
          Clear Filter
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />
}
