'use client'

import { LuStar } from "react-icons/lu";
import { Skeleton, Empty } from 'antd'
import { PlaceInfo } from "@/interfaces/itinerary.interface";

interface ReviewsTabProps {
    placeDetails: PlaceInfo | undefined
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ placeDetails }) => {
    if (!placeDetails) {
        return (
            <div className="p-4">
                <Skeleton active avatar paragraph={{ rows: 2 }} className="mb-4" />
                <Skeleton active avatar paragraph={{ rows: 2 }} className="mb-4" />
                <Skeleton active avatar paragraph={{ rows: 2 }} />
            </div>
        );
    }

    if (!placeDetails?.reviews || placeDetails.reviews.length === 0) {
        return (
            <div className="p-4">
                <Empty
                    description="No reviews available for this place"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    return (
        <div className="px-2 -mt-2">
            <div className="space-y-4 max-h-64 overflow-y-auto">
                {placeDetails.reviews.slice(0, 5).map((review, index: number) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{review.authorName}</span>
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <LuStar
                                        key={i}
                                        className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {new Date(review.time * 1000).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsTab;