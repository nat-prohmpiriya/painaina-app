"use client"

import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DateInputProps {
  value: Date
  onChange: (date: Date) => void
  onClose?: () => void
}

export function DateInput({ value, onChange, onClose }: DateInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      setIsEditing(false)
      onClose?.()
    }
    if (e.key === "Escape") {
      setIsEditing(false)
      onClose?.()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const date = new Date(inputValue)
    if (!isNaN(date.getTime())) {
      onChange(date)
    }
  }

  const handleClick = () => {
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={format(value, "yyyy-MM-dd")}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setIsEditing(false)
          onClose?.()
        }}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    )
  }

  return (
    <Button
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        !value && "text-muted-foreground"
      )}
      onClick={handleClick}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? format(value, "PPP") : <span>Pick a date</span>}
    </Button>
  )
}