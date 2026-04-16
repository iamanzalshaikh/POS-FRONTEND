import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface EnhancedCalendarProps {
  value?: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
  className?: string
  labelClassName?: string
  inputClassName?: string
  id?: string
  name?: string
}

export default function EnhancedCalendar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Select date',
  label,
  required = false,
  disabled = false,
  min,
  max,
  className = '',
  labelClassName = '',
  inputClassName = '',
  id,
  name
}: EnhancedCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update selected date when value prop changes
  useEffect(() => {
    setSelectedDate(value ? new Date(value) : null)
  }, [value])

  // Detect space on open to decide position (top or bottom)
  useEffect(() => {
    if (isOpen && calendarRef.current) {
      const rect = calendarRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      
      // If less than 320px below (calendar height approx), and more space above, flip it
      if (spaceBelow < 320 && spaceAbove > spaceBelow) {
        setOpenUpwards(true)
      } else {
        setOpenUpwards(false)
      }
    }
  }, [isOpen])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i))
    }

    return days
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Extract local date correctly without UTC shift
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    onChange(formattedDate)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleTodayClick = () => {
    const today = new Date()
    setCurrentMonth(today)

    // Instead of reusing handleDateSelect which toggles menu, 
    // run the selection explicitly
    setSelectedDate(today)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    onChange(formattedDate)
    setIsOpen(false)
  }

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return placeholder
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const years = Array.from({ length: 121 }, (_, i) => new Date().getFullYear() - 100 + i)

  const handleMonthChange = (month: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1))
  }

  const handleYearChange = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1))
  }

  const calendarDays = generateCalendarDays()
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const isDisabled = (date: Date) => {
    if (min && date < new Date(min)) return true
    if (max && date > new Date(max)) return true
    return false
  }

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      {label && (
        <label htmlFor={id} className={labelClassName || "block text-sm font-medium text-[#111218] mb-2"}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={inputClassName || `
            w-full rounded-xl border border-input bg-background px-4 py-3 text-left text-sm
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            transition-all duration-200 flex items-center justify-between
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
            ${selectedDate ? 'text-foreground font-black' : 'text-muted-foreground'}
          `}
        >
          <span className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <span>{formatDateDisplay(selectedDate)}</span>
          </span>
          <ChevronDown 
            size={18} 
            className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
          {selectedDate && onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(null)
                onChange('')
                onClear()
              }}
              disabled={disabled}
              className="p-1 rounded-lg hover:bg-destructive/10 transition-colors ml-2"
              title="Clear date"
            >
              <X size={14} className="text-destructive" />
            </button>
          )}
        </button>

        {isOpen && (
          <div className={`absolute ${openUpwards ? 'bottom-full mb-3' : 'top-full mt-3'} left-1/2 -translate-x-1/2 z-[9999] bg-card rounded-xl border border-border shadow-2xl overflow-hidden w-64 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="p-1.5 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between mb-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1">
                  <select
                    value={currentMonth.getMonth()}
                    onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                    className="px-2 py-1 rounded border border-border bg-card text-xs font-black uppercase tracking-widest text-foreground focus:border-primary focus:outline-none"
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index}>{month.slice(0, 3)}</option>
                    ))}
                  </select>

                  <select
                    value={currentMonth.getFullYear()}
                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                    className="px-2 py-1 rounded border border-border bg-card text-xs font-black uppercase tracking-widest text-foreground focus:border-primary focus:outline-none"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleTodayClick}
                className="w-full py-0.5 px-2 border border-primary/30 bg-primary text-primary-foreground rounded text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 hover:text-primary-foreground transition-all"
              >
                Today
              </button>
            </div>

            <div className="p-1 bg-card">
              <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-[8px] font-black text-muted-foreground uppercase tracking-tighter py-0.5">
                    {day[0]}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day ? (
                      <button
                        type="button"
                        onClick={() => !isDisabled(day) && handleDateSelect(day)}
                        disabled={isDisabled(day)}
                        className={`
                          w-full h-full rounded text-xs font-bold transition-all duration-200
                          ${isToday(day)
                            ? 'bg-primary text-primary-foreground ring-1 ring-primary/50'
                            : isSelected(day)
                              ? 'bg-primary text-primary-foreground border border-primary/60'
                              : 'hover:bg-muted/80 text-foreground'
                          }
                          ${isDisabled(day)
                            ? 'opacity-20 cursor-not-allowed'
                            : 'cursor-pointer'
                          }
                        `}
                      >
                        {day.getDate()}
                      </button>
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}
