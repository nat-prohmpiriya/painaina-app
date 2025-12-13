import { Avatar, Button, Tag } from "antd";
import { LuHeart, LuMessageSquare, LuSend, LuEye } from "react-icons/lu";
import Link from "next/link";
import type { TripDetailResponse } from "@/interfaces/trip.interface";

interface HoeroTripProps {
    guide: TripDetailResponse;
}

const HoeroTrip: React.FC<HoeroTripProps> = ({ guide }) => {

    const editGuideBtn = (
        <div className="absolute top-4 right-4">
            <Link href={`/guides/${guide.id}`}>
                <Button shape="round" type="default" >
                    <span className="font-bold">Edit</span>
                </Button>
            </Link>
        </div>
    )

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className='w-full'>
            <div className="w-full relative">
                <img src={guide.coverPhoto} alt={guide.title} className="h-108 object-cover w-full" />
                <div className="absolute bottom-0 left-0 w-full p-4">
                    <div className="flex h-full">
                        <div className="flex flex-col text-white gap-2">
                            <h1 className="font-semibold text-3xl">{guide.title}</h1>
                            <div className="flex flex-wrap gap-2">
                                {
                                    guide?.tags?.map((tag: string) => <Tag style={{ borderRadius: '12px' }} color="blue" key={tag}>{tag}</Tag>)
                                }
                            </div>
                        </div>
                    </div>
                </div>
                {editGuideBtn}
            </div>
            <div className="p-6">
                <div className="flex justify-between">
                    <div className="flex gap-4">
                        <Avatar src={guide.owner.photoUrl} size={48} />
                        <div className="flex flex-col">
                            <span className="font-semibold text-xl">{guide.owner.name}</span>
                            <div>{formatDate(guide.createdAt)}</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">

                        <Button shape="round" size="large" danger type="primary" style={{ width: 120 }}>
                            <span className="font-bold">Follow</span>
                        </Button>

                        <Button icon={<LuHeart size={24} />} shape="circle" size="large" type="text" />
                        <span>{guide.reactionsCount || 0}</span>
                        <Button icon={<LuEye size={24} />} shape="circle" size="large" type="text" />
                        <span>{guide.viewCount || 0}</span>
                        <Button icon={<LuMessageSquare size={24} />} shape="circle" size="large" type="text" />
                        <span>{0}</span>
                        <Button icon={<LuSend size={24} />} shape="circle" size="large" type="text" />

                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-500 px-4 my-6 mx-4">{guide.description}</p>
        </div>
    )
}

export default HoeroTrip