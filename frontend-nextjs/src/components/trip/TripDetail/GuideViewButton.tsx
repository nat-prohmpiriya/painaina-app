'use client'

import { Tooltip } from 'antd'
import { useTripContext } from '@/contexts/TripContext'
import { useRouter } from 'next/navigation';
import { LuEye } from "react-icons/lu";

const GuideViewButton = () => {
    const { tripData } = useTripContext()
    const router = useRouter();
    const gotGuidViewPage = (`/guides/${tripData?.id}/${tripData?.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || 'guide'}`);
    return (
        <Tooltip title="View as Guide" >
            <div
                onClick={() => router.push(gotGuidViewPage)}
                className='bg-black/40 h-10 w-10 flex justify-center items-center rounded-full p-2 cursor-pointer hover:bg-black/70 transition'
            >
                <LuEye size={22} className='text-white' />
            </div>
        </Tooltip>
    )
}

export default GuideViewButton