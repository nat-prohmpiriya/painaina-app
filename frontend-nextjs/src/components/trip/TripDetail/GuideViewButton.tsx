'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTripContext } from '@/contexts/TripContext'
import { useRouter } from 'next/navigation';
import { LuEye } from "react-icons/lu";

const GuideViewButton = () => {
    const { tripData } = useTripContext()
    const router = useRouter();
    const gotGuidViewPage = (`/guides/${tripData?.id}/${tripData?.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || 'guide'}`);
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        onClick={() => router.push(gotGuidViewPage)}
                        className='bg-black/40 h-10 w-10 flex justify-center items-center rounded-full p-2 cursor-pointer hover:bg-black/70 transition'
                    >
                        <LuEye size={22} className='text-white' />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>View as Guide</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default GuideViewButton