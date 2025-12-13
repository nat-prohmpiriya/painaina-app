'use client'

import { DatePicker } from "antd"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import dayjs, { Dayjs } from "dayjs"

const { RangePicker } = DatePicker

interface DateRangePickerProps {
  date?: DateRange
  onSelect: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  date,
  onSelect,
  placeholder = "Pick a date range",
  className
}: DateRangePickerProps) {
  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onSelect({
        from: dates[0].toDate(),
        to: dates[1].toDate()
      })
    } else {
      onSelect(undefined)
    }
  }

  const value: [Dayjs | null, Dayjs | null] | null = date?.from && date?.to 
    ? [dayjs(date.from), dayjs(date.to)]
    : null

  return (
    <RangePicker
      value={value}
      onChange={handleChange}
      placeholder={[
        placeholder.includes('-') ? placeholder.split(' - ')[0] : 'Start date',
        placeholder.includes('-') ? placeholder.split(' - ')[1] : 'End date'
      ]}
      className={`w-full ${className}`}
      size="large"
    />
  )
}