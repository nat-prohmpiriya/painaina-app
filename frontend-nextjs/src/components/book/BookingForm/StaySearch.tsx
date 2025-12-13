'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InputNumber } from '@/components/ui/input-number'
import React from 'react'

const StaySearchForm = () => {
    const [nights, setNights] = React.useState<number | null>(1)

    return (
        <div className='bg-white shadow-md p-4 rounded-lg w-full'>
            <div className='flex flex-col gap-2'>
                <label className='text-sm font-semibold'>City:</label>
                <Input className="w-full h-10" placeholder="Search for stays..." />
            </div>
            <div className='grid grid-cols-2 gap-4 mt-4'>
                <div className='flex flex-col gap-2'>
                    <label className='text-sm font-semibold'>Check-in:</label>
                    <Input type="date" className="w-full h-10" />
                </div>
                <div className='flex flex-col gap-2'>
                    <label className='text-sm font-semibold'>Nights:</label>
                    <InputNumber
                        min={1}
                        value={nights}
                        onChange={setNights}
                        className="w-full"
                    />
                </div>
            </div>
            <div className='flex gap-2 items-start flex-col w-full mt-4'>
                <label className='text-sm font-semibold'>With:</label>
                <Select defaultValue="agoda">
                    <SelectTrigger className="w-full h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="booking.com">
                            <span className='font-semibold'>Booking.com</span>
                        </SelectItem>
                        <SelectItem value="airbnb">
                            <span className='font-semibold'>Airbnb</span>
                        </SelectItem>
                        <SelectItem value="agoda">
                            <span className='font-semibold'>Agoda</span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button className='mt-6 w-full rounded-full h-10 bg-red-500 hover:bg-red-600 text-white'>Search</Button>
        </div>
    )
}

export default StaySearchForm