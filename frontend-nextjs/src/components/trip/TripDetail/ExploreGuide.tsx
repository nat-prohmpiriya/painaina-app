
'use client'

import GuideCard from '@/components/guide/GuideCard'
import { Button } from 'antd'
import React from 'react'
import { useTrips } from '@/hooks/useTripQueries'

const ExploreGuide = () => {
    const { data: allTrips } = useTrips({
        type: "guide",
        status: "published",
        limit: 10
    })

    const guides = allTrips?.data?.filter((trip: any) => trip.type === "guide") || []

    if (!allTrips || guides.length === 0) {
        return null
    }

    return (
        <div className='my-8 px-4'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold'>Explore Guide</h2>
                <Button color='danger' shape='round' variant='solid' className='font-semibold'>See All</Button>
            </div>
            <div className='flex gap-4 overflow-x-auto py-6 [&::-webkit-scrollbar]:hidden scrollbar-width-none'>
                {guides.map((guide: any) => (
                    <GuideCard key={guide.id} guide={guide} />
                ))}
            </div>
        </div>
    )
}

export default ExploreGuide