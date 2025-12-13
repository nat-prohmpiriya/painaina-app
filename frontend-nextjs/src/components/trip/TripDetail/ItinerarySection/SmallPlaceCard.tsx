'use client'

import { imgUrl } from "@/lib/imgUrl"
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const SmallPlaceCard = () => {
    return (
        <div className='flex shadow-md rounded-lg w-[300px] flex-shrink-0'>
            <div className="relative h-16 w-24 flex-shrink-0">
                <Image
                    src={imgUrl}
                    alt="Place"
                    fill
                    className="rounded-l-lg object-cover"
                />
            </div>
            <div className="py-2 px-4 border border-l-0 rounded-r-lg bg-white flex-1 min-w-0 flex justify-between items-start">
                <div>
                    <h3 className="font-semibold truncate">Place Title</h3>
                    <p className="text-xs text-gray-500 truncate">Place category</p>
                </div>
                <Button size="sm" variant="outline" className="h-6 w-6 p-0 rounded-full mt-2">+</Button>
            </div>
        </div>
    )
}

export default SmallPlaceCard