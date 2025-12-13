'use client'

import { LuStar, LuGlobe, LuPhone, LuClock, LuMapPin, LuInfo } from "react-icons/lu";
import { Skeleton, Alert, Empty, Image } from 'antd'
import AddToTripButton from "../AddToTripButton";
import { PlaceInfo } from "@/interfaces/itinerary.interface";

interface AboutTabProps {
    placeDetails: PlaceInfo | undefined
}

const AboutTab: React.FC<AboutTabProps> = ({ placeDetails }) => {
    // Get photo URL from API
    const getPhotoUrl = (photoReference: string, maxWidth: number = 300): string => {
        if (!photoReference) return `https://via.placeholder.com/${maxWidth}x${Math.floor(maxWidth * 0.75)}?text=No+Image`;
        return `${process.env.NEXT_PUBLIC_API_URL}/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`;
    };
    // Render star rating


    if (!placeDetails) {
        return (
            <div className="p-4">
                <Skeleton active paragraph={{ rows: 3 }} />
            </div>
        );
    }

    if (!placeDetails) {
        return (
            <div className="p-4">
                <Empty description="Loading place details..." />
            </div>
        );
    }

    return (
        <div className="px-2 pb-4 -mt-2 overflow-y-auto max-h-[35vh]">
            <div className="">
                {/* Google Places Information */}
                <div className="grid grid-cols-5">
                    <div className="col-span-3 space-y-3">
                        <AddToTripButton placeDetails={placeDetails} />
                        <div className="flex gap-4">
                            <LuStar size={22} className="text-yellow-300 fill-current" />
                            <span className="text-sm font-bold">{placeDetails?.rating}</span>
                            <span className="text-sm text-gray-500">({placeDetails?.userRatingsTotal} reviews)</span>
                        </div>
                        <div className="flex gap-4">
                            <LuInfo size={28} />
                            <p className="text-gray-600 text-sm text-wrap">{placeDetails?.editorialSummary?.overview}</p>
                        </div>
                        <div className="flex gap-4">
                            <LuMapPin size={22} />
                            <p className="text-gray-600 text-sm">{placeDetails?.address}</p>
                        </div>

                        <div className="flex gap-4">
                            <LuPhone size={18} />
                            <p className="text-sm text-gray-600">{placeDetails?.phone}</p>
                        </div>
                        <p className="flex gap-4">
                            <LuGlobe size={20} className="text-gray-600" />
                            {
                                placeDetails?.website
                                    ? (
                                        <a href={placeDetails?.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                            {placeDetails?.website && 'Visit Website'}
                                        </a>
                                    )
                                    : <span className="text-gray-500">No website available</span>
                            }

                        </p>
                        <p className="flex gap-4">
                            <LuClock size={18} className="text-gray-500 mt-1" />
                            <span className={placeDetails?.openingHours?.openNow ? 'text-green-600' : 'text-red-600'}>
                                {placeDetails?.openingHours?.openNow ? 'Open now' : 'Closed'}
                            </span>
                        </p>

                    </div>

                    <div className="col-span-2">
                        {placeDetails?.photos?.[0] && (
                            <div className="ml-4">
                                <Image
                                    src={getPhotoUrl(placeDetails.photos[0].photoReference, 300)}
                                    alt={`${placeDetails.name} - Photo`}
                                    className="rounded-lg object-cover w-full shadow-sm"
                                    height={250}
                                    width="100%"
                                    style={{ objectFit: 'cover' }}
                                    preview={false}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Google Places Information */}
                {placeDetails && (
                    <div className="mt-3 space-y-3">
                        {placeDetails?.openingHours?.weekdayText && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Opening Hours:</h4>
                                <div className="text-xs text-gray-600 space-y-1">
                                    {placeDetails?.openingHours?.weekdayText.map((day: string, index: number) => (
                                        <div key={index}>{day}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {placeDetails.priceLevel !== undefined && (
                            <div className="">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Price Level:</h4>
                                <div className="flex ml-2">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-lg ${i < (placeDetails.priceLevel || 0) ? 'text-green-500' : 'text-gray-300'}`}>
                                            $
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AboutTab;