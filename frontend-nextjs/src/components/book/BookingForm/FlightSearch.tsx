'use client'

import { Input, Select, Button } from "antd"
import { LuPlaneTakeoff, LuPlaneLanding } from "react-icons/lu";


const FlightSearchForm = () => {
    return (
        <div className='bg-white shadow-2xl p-4 rounded-lg w-full flex flex-col gap-4'>
            <div>
                <label className='text-sm font-semibold'>From:</label>
                <Input size="large" prefix={<LuPlaneTakeoff size={20} />} />
            </div>
            <div>
                <label className='text-sm font-semibold'>To:</label>
                <Input size="large" prefix={<LuPlaneLanding size={20} />} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 col-span-1">
                    <label className='text-sm font-semibold'>Depart:</label>
                    <Input />
                </div>
                <div className="flex flex-col gap-2 col-span-1">
                    <label className='text-sm font-semibold'>Return:</label>
                    <Input />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex-1">
                    <label className='text-sm font-semibold'>Passengers:</label>
                    <Select style={{ width: '100%' }} />
                </div>
                <div>
                    <label className='text-sm font-semibold'>16 or younger</label>
                    <Select style={{ width: '100%' }} />
                </div>
            </div>
            <Button variant="solid" color="danger" size="large" shape="round" block>Search</Button>
        </div>
    )
}

export default FlightSearchForm