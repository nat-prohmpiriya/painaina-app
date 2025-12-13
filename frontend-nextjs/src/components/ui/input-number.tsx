"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InputNumberProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  showControls?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  formatter?: (value: number) => string
  parser?: (value: string) => number
}

export function InputNumber({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision,
  showControls = true,
  prefix,
  suffix,
  formatter,
  parser,
  className,
  disabled,
  ...props
}: InputNumberProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    value !== undefined ? String(value) : ""
  )

  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue(formatter ? formatter(value) : String(value))
    }
  }, [value, formatter])

  const clamp = (num: number) => {
    let result = num
    if (min !== undefined && result < min) result = min
    if (max !== undefined && result > max) result = max
    if (precision !== undefined) {
      result = Number(result.toFixed(precision))
    }
    return result
  }

  const parseValue = (val: string): number | null => {
    if (val === "" || val === "-") return null
    const parsed = parser ? parser(val) : parseFloat(val)
    return isNaN(parsed) ? null : parsed
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    // Allow typing minus sign and decimal point
    if (val === "-" || val === "." || val === "-.") {
      setInputValue(val)
      return
    }

    setInputValue(val)
    const parsed = parseValue(val)
    if (parsed !== null) {
      onChange?.(clamp(parsed))
    } else if (val === "") {
      onChange?.(null)
    }
  }

  const handleBlur = () => {
    const parsed = parseValue(inputValue)
    if (parsed !== null) {
      const clamped = clamp(parsed)
      setInputValue(formatter ? formatter(clamped) : String(clamped))
      onChange?.(clamped)
    } else {
      setInputValue("")
      onChange?.(null)
    }
  }

  const increment = () => {
    const current = parseValue(inputValue) ?? 0
    const newValue = clamp(current + step)
    setInputValue(formatter ? formatter(newValue) : String(newValue))
    onChange?.(newValue)
  }

  const decrement = () => {
    const current = parseValue(inputValue) ?? 0
    const newValue = clamp(current - step)
    setInputValue(formatter ? formatter(newValue) : String(newValue))
    onChange?.(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      increment()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      decrement()
    }
  }

  const canIncrement = max === undefined || (parseValue(inputValue) ?? 0) < max
  const canDecrement = min === undefined || (parseValue(inputValue) ?? 0) > min

  return (
    <div className={cn("flex items-center", className)}>
      {showControls && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-r-none border-r-0"
          onClick={decrement}
          disabled={disabled || !canDecrement}
        >
          <Minus className="h-4 w-4" />
        </Button>
      )}
      <div className="relative flex-1">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          {...props}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "text-center",
            showControls && "rounded-none",
            prefix && "pl-8",
            suffix && "pr-8"
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {showControls && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-l-none border-l-0"
          onClick={increment}
          disabled={disabled || !canIncrement}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
