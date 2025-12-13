import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Send, Eye, User } from "lucide-react";
import Link from "next/link";
import type { TripDetailResponse } from "@/interfaces/trip.interface";

interface HoeroTripProps {
    guide: TripDetailResponse;
}

const HoeroTrip: React.FC<HoeroTripProps> = ({ guide }) => {

    const editGuideBtn = (
        <div className="absolute top-4 right-4">
            <Link href={`/guides/${guide.id}`}>
                <Button variant="secondary" className="rounded-full">
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
                                    guide?.tags?.map((tag: string) => (
                                        <Badge key={tag} variant="secondary" className="rounded-xl bg-blue-500 text-white">
                                            {tag}
                                        </Badge>
                                    ))
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
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={guide.owner.photoUrl} alt={guide.owner.name} />
                            <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-xl">{guide.owner.name}</span>
                            <div>{formatDate(guide.createdAt)}</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">

                        <Button variant="destructive" size="lg" className="rounded-full w-[120px]">
                            <span className="font-bold">Follow</span>
                        </Button>

                        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                            <Heart size={24} />
                        </Button>
                        <span>{guide.reactionsCount || 0}</span>
                        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                            <Eye size={24} />
                        </Button>
                        <span>{guide.viewCount || 0}</span>
                        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                            <MessageSquare size={24} />
                        </Button>
                        <span>{0}</span>
                        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                            <Send size={24} />
                        </Button>

                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-500 px-4 my-6 mx-4">{guide.description}</p>
        </div>
    )
}

export default HoeroTrip