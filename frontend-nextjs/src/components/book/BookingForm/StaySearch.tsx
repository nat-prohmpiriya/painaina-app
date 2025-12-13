'use client'

import { Button, Input } from 'antd'
import React from 'react'
import { Select, DatePicker, InputNumber } from 'antd'

const StaySearchForm = () => {
    return (
        <div className='bg-white shadow-md p-4 rounded-lg w-full'>
            <div className='flex flex-col gap-2'>
                <label className='text-sm font-semibold'> City:</label>
                <Input style={{ width: '100%', height: '40px' }} placeholder="Search for stays..." />
            </div>
            <div className='grid grid-cols-2 gap-4 mt-4'>
                <div className='flex flex-col gap-2'>
                    <label className='text-sm font-semibold'> Check-in:</label>
                    <DatePicker style={{ width: '100%', height: '40px' }} />
                </div>
                <div className='flex flex-col gap-2'>
                    <label className='text-sm font-semibold'> Nights:</label>
                    <InputNumber min={1} defaultValue={1} style={{ width: '100%', height: '40px' }} />
                </div>


            </div>
            <div className='flex gap-2 items-start flex-col w-full mt-4'>
                <label className='text-sm font-semibold'>With:</label>
                <Select
                    defaultValue={"agoda"}
                    style={{ width: '100%', height: '40px' }}
                    options={[
                        { value: 'booking.com', label: <span className='font-semibold'>Booking.com</span> },
                        { value: 'airbnb', label: <span className='font-semibold'>Airbnb</span> },
                        { value: 'agoda', label: <span className='font-semibold'>Agoda</span> },
                    ]}
                />
            </div>
            <Button className='mt-6' shape="round" size='large' variant='solid' color='danger' block>Search</Button>
        </div>
    )
}

export default StaySearchForm