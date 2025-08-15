"use client"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date?: DateRange | undefined
  onDateChange?: (date: DateRange | undefined) => void
  value?: DateRange | undefined | { from: Date; to: Date }
  onChange?: (date: DateRange | undefined | { from: Date; to: Date }) => void
  className?: string
}

export function DatePickerWithRange({ className, date, onDateChange, value, onChange }: DatePickerWithRangeProps) {
  // Support both prop styles: (date, onDateChange) and (value, onChange)
  const selectedRange = date || value
  const handleChange = onDateChange || onChange

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !selectedRange && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange?.from ? (
              selectedRange.to ? (
                <>
                  {format(selectedRange.from, "dd/MM/yyyy", { locale: vi })} -{" "}
                  {format(selectedRange.to, "dd/MM/yyyy", { locale: vi })}
                </>
              ) : (
                format(selectedRange.from, "dd/MM/yyyy", { locale: vi })
              )
            ) : (
              <span>Chọn khoảng thời gian</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedRange?.from}
            selected={selectedRange}
            onSelect={handleChange}
            numberOfMonths={2}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Export alias for compatibility
export { DatePickerWithRange as DateRangePicker }
