'use client'

import { imgUrl } from "@/lib/imgUrl"
import { Avatar } from "antd"
import { LuHeart } from "react-icons/lu"
import { FaRegEye } from "react-icons/fa6"
import { LuCalendar, LuMapPin } from "react-icons/lu"
import { useRouter } from "next/navigation"
import { TripDetailResponse } from "@/interfaces/trip.interface"

interface GuideCardProps {
    guide: TripDetailResponse
}

const GuideCard = ({ guide }: GuideCardProps) => {
    const router = useRouter()
    if (!guide) {
        return null
    }

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'Easy': return 'text-green-600 bg-green-100'
            case 'Moderate': return 'text-yellow-600 bg-yellow-100'
            case 'Hard': return 'text-orange-600 bg-orange-100'
            case 'Expert': return 'text-red-600 bg-red-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const gotGuidViewPage = (`/guides/${guide?.id}/${guide?.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || 'guide'}`);

    return (
        <div className="w-full bg-white shadow-lg rounded-xl cursor-pointer hover:shadow-xl transition-shadow duration-300" onClick={() => router.push(gotGuidViewPage)}>
            <div className="overflow-hidden rounded-t-xl h-40 relative">
                <img
                    src={guide.coverPhoto || imgUrl}
                    alt={guide.title}
                    className="w-full h-40 object-cover rounded-t-xl transform hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(guide.level || '')}`}>
                        {guide.level}
                    </span>
                </div>
            </div>
            <div className="p-4">
                <h2 className="font-semibold text-lg truncate mb-2">{guide.title}</h2>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{guide.description}</p>

                <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-500">
                        <LuMapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{guide?.destinations?.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <LuCalendar className="w-4 h-4 mr-1" />
                        <span>Updated {new Date(guide.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Avatar
                            size="small"
                            src={guide.owner.photoUrl || imgUrl}
                        />
                        <span className="ml-2 text-sm text-gray-700">{guide.owner.name || 'Anonymous'}</span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <LuHeart className="w-4 h-4 text-red-500" />
                            <span>{guide.reactionsCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaRegEye className="w-4 h-4 text-gray-500" />
                            <span>{guide.viewCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GuideCard