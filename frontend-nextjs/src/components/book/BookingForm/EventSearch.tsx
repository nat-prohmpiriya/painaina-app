'use client';

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const EventSearch = () => {
    return (
        <div className='bg-white shadow-md p-4 rounded-lg w-full'>
            <div className='flex flex-col gap-2'>
                <label className='text-sm font-semibold'>Where:</label>
                <Input className="w-full h-10" placeholder="Search for events..." />
            </div>

            <div className='flex flex-col gap-2 mt-4'>
                <label className='text-sm font-semibold'>Date</label>
                <Input type="date" className="w-full h-10" />
            </div>

            <div className='flex gap-2 items-start flex-col w-full mt-4'>
                <label className='text-sm font-semibold'>With:</label>
                <Select defaultValue="klook">
                    <SelectTrigger className="w-full h-10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="klook">
                            <span className='font-semibold'>Klook</span>
                        </SelectItem>
                        <SelectItem value="wabunka">
                            <span className='font-semibold'>Wabunka</span>
                        </SelectItem>
                        <SelectItem value="viator">
                            <span className='font-semibold'>Viator</span>
                        </SelectItem>
                        <SelectItem value="rekutel-travel-expense-insurance">
                            <span className='font-semibold'>Rekutel Travel Expense Insurance</span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button className='mt-6 w-full rounded-full h-10 bg-red-500 hover:bg-red-600 text-white'>Search</Button>
        </div>
    )
}

export default EventSearch