'use client'

import { DatePicker } from "antd"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import dayjs, { Dayjs } from "dayjs"

const { RangePicker } = DatePicker

interface EnhancedDateRangePickerProps {
  date?: DateRange
  onSelect: (date: DateRange | undefined) => void
  placeholder?: string
  className?: string
  minDate?: Date
}

export function EnhancedDateRangePicker({
  date,
  onSelect,
  placeholder = "When's your trip?",
  className,
  minDate = new Date()
}: EnhancedDateRangePickerProps) {
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

  const disabledDate = (current: Dayjs) => {
    return current && current < dayjs(minDate).startOf('day')
  }

  return (
    <>
      <style jsx global>{`
        
        }
      `}</style>
      <RangePicker
        value={value}
        onChange={handleChange}
        placeholder={[
          placeholder.includes('-') ? placeholder.split(' - ')[0] : 'Start date',
          placeholder.includes('-') ? placeholder.split(' - ')[1] : 'End date'
        ]}
        className={`w-full ${className}`}
        size="large"
        disabledDate={disabledDate}
      />
    </>
  )
}