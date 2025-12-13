"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string // HH:mm format
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  format?: "12h" | "24h"
  minuteStep?: number
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled,
  className,
  format = "24h",
  minuteStep = 15,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const hours = format === "24h"
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1)

  const minutes = Array.from(
    { length: Math.floor(60 / minuteStep) },
    (_, i) => i * minuteStep
  )

  const periods = ["AM", "PM"]

  const parseValue = (val: string) => {
    if (!val) return { hour: null, minute: null, period: "AM" }
    const [h, m] = val.split(":").map(Number)
    if (format === "12h") {
      const period = h >= 12 ? "PM" : "AM"
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      return { hour: hour12, minute: m, period }
    }
    return { hour: h, minute: m, period: "AM" }
  }

  const { hour: selectedHour, minute: selectedMinute, period: selectedPeriod } = parseValue(value || "")

  const formatTime = (h: number, m: number, p?: string) => {
    let hour24 = h
    if (format === "12h" && p) {
      if (p === "PM" && h !== 12) hour24 = h + 12
      if (p === "AM" && h === 12) hour24 = 0
    }
    return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  const displayValue = value
    ? format === "12h"
      ? `${selectedHour}:${String(selectedMinute).padStart(2, "0")} ${selectedPeriod}`
      : value
    : placeholder

  const handleHourClick = (h: number) => {
    const minute = selectedMinute ?? 0
    onChange?.(formatTime(h, minute, selectedPeriod))
  }

  const handleMinuteClick = (m: number) => {
    const hour = selectedHour ?? (format === "12h" ? 12 : 0)
    onChange?.(formatTime(hour, m, selectedPeriod))
  }

  const handlePeriodClick = (p: string) => {
    if (selectedHour !== null && selectedMinute !== null) {
      onChange?.(formatTime(selectedHour, selectedMinute, p))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r">
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
              Hour
            </div>
            <ScrollArea className="h-48">
              <div className="p-1">
                {hours.map((h) => (
                  <Button
                    key={h}
                    variant={selectedHour === h ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handleHourClick(h)}
                  >
                    {format === "24h" ? String(h).padStart(2, "0") : h}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className={format === "12h" ? "border-r" : ""}>
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
              Minute
            </div>
            <ScrollArea className="h-48">
              <div className="p-1">
                {minutes.map((m) => (
                  <Button
                    key={m}
                    variant={selectedMinute === m ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handleMinuteClick(m)}
                  >
                    {String(m).padStart(2, "0")}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          {format === "12h" && (
            <div>
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                Period
              </div>
              <div className="p-1">
                {periods.map((p) => (
                  <Button
                    key={p}
                    variant={selectedPeriod === p ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handlePeriodClick(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimeRangePickerProps {
  startValue?: string
  endValue?: string
  onStartChange?: (value: string) => void
  onEndChange?: (value: string) => void
  startPlaceholder?: string
  endPlaceholder?: string
  disabled?: boolean
  className?: string
  format?: "12h" | "24h"
  minuteStep?: number
}

export function TimeRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startPlaceholder = "Start time",
  endPlaceholder = "End time",
  disabled,
  className,
  format = "24h",
  minuteStep = 15,
}: TimeRangePickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TimePicker
        value={startValue}
        onChange={onStartChange}
        placeholder={startPlaceholder}
        disabled={disabled}
        format={format}
        minuteStep={minuteStep}
        className="flex-1"
      />
      <span className="text-muted-foreground">-</span>
      <TimePicker
        value={endValue}
        onChange={onEndChange}
        placeholder={endPlaceholder}
        disabled={disabled}
        format={format}
        minuteStep={minuteStep}
        className="flex-1"
      />
    </div>
  )
}
