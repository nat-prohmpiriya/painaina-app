'use client';

import { Input, DatePicker, InputNumber, Select, Button } from "antd"

const EventSearch = () => {
    return (
        <div className='bg-white shadow-md p-4 rounded-lg w-full'>
            <div className='flex flex-col gap-2'>
                <label className='text-sm font-semibold'> Where:</label>
                <Input style={{ width: '100%', height: '40px' }} placeholder="Search for stays..." />
            </div>

            <div className='flex flex-col gap-2 mt-4'>
                <label className='text-sm font-semibold'>Date</label>
                <DatePicker style={{ width: '100%', height: '40px' }} />
            </div>



            <div className='flex gap-2 items-start flex-col w-full mt-4'>
                <label className='text-sm font-semibold'>With:</label>
                <Select
                    defaultValue={"klook"}
                    style={{ width: '100%', height: '40px' }}
                    options={[
                        { value: 'klook', label: <span className='font-semibold'>Klook</span> },
                        { value: 'wabunka', label: <span className='font-semibold'>Wabunka</span> },
                        { value: 'viator', label: <span className='font-semibold'>Viator</span> },
                        { value: 'rekutel-travel-expense-insurance', label: <span className='font-semibold'>Rekutel Travel Expense Insurance</span> },
                    ]}
                />
            </div>
            <Button className='mt-6' shape="round" size='large' variant='solid' color='danger' block>Search</Button>
        </div>
    )
}

export default EventSearch