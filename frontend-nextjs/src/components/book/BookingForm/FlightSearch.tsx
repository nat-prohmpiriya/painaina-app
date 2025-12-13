'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PlaneTakeoff, PlaneLanding } from 'lucide-react';


const FlightSearchForm = () => {
    return (
        <div className='bg-white shadow-2xl p-4 rounded-lg w-full flex flex-col gap-4'>
            <div>
                <label className='text-sm font-semibold'>From:</label>
                <div className="relative mt-1">
                    <PlaneTakeoff className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input className="pl-10 h-10" />
                </div>
            </div>
            <div>
                <label className='text-sm font-semibold'>To:</label>
                <div className="relative mt-1">
                    <PlaneLanding className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input className="pl-10 h-10" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 col-span-1">
                    <label className='text-sm font-semibold'>Depart:</label>
                    <Input type="date" />
                </div>
                <div className="flex flex-col gap-2 col-span-1">
                    <label className='text-sm font-semibold'>Return:</label>
                    <Input type="date" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex-1">
                    <label className='text-sm font-semibold'>Passengers:</label>
                    <Select>
                        <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select passengers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5+</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className='text-sm font-semibold'>16 or younger</label>
                    <Select>
                        <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select children" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button className="rounded-full h-10 bg-red-500 hover:bg-red-600 text-white">Search</Button>
        </div>
    )
}

export default FlightSearchForm