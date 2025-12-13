'use client'

import { imgUrl } from "@/lib/imgUrl"
import { Button } from "antd"

const SmallPlaceCard = () => {
    return (
        <div className='flex shadow-md rounded-lg w-[300px] flex-shrink-0'>
            <img
                src={imgUrl}
                alt="Place"
                className="h-16 w-24 rounded-l-lg object-cover flex-shrink-0"
            />
            <div className="py-2 px-4 border border-l-0 rounded-r-lg bg-white flex-1 min-w-0 flex justify-between items-start">
                <div>
                    <h3 className="font-semibold truncate">Place Title</h3>
                    <p className="text-xs text-gray-500 truncate">Place category</p>
                </div>
                <Button size="small" type="dashed" shape="circle" className="mt-2">+</Button>
            </div>
        </div>
    )
}

export default SmallPlaceCard