'use client'

import { Image, Skeleton, Empty } from 'antd'
import { useState, useEffect } from 'react'
import { PlaceInfo } from '@/interfaces/itinerary.interface'

interface PhotosTabProps {
    placeDetails: PlaceInfo | undefined
}

const PhotosTab: React.FC<PhotosTabProps> = ({ placeDetails }) => {
    // Get photo URL from API
    const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
        if (!photoReference) return `https://via.placeholder.com/${maxWidth}x${Math.floor(maxWidth * 0.75)}?text=No+Image`;
        return `${process.env.NEXT_PUBLIC_API_URL}/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`;
    };

    if (!placeDetails) {
        return (
            <div className="p-3 overflow-y-auto max-h-80">
                <Skeleton.Image className="w-full mb-2" style={{ height: 180 }} />
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton.Image style={{ height: 100 }} />
                    <Skeleton.Image style={{ height: 100 }} />
                    <Skeleton.Image style={{ height: 100 }} />
                </div>
            </div>
        );
    }

    if (!placeDetails?.photos || placeDetails.photos.length === 0) {
        return (
            <div className="p-3 overflow-y-auto max-h-80">
                <Empty
                    description="No photos available for this place"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    return (
        <div className="px-2 pb-2 -mt-2 overflow-y-auto max-h-[35vh]">
            <Image.PreviewGroup>
                <div className="space-y-2">
                    {/* Large featured photo - Full width */}
                    {placeDetails.photos.slice(0, 1)[0] && (
                        <div className="w-full">
                            <Image
                                src={getPhotoUrl(placeDetails.photos[0].photoReference, 600)}
                                alt={`${placeDetails.name} - Photo 1`}
                                className="rounded-xl object-cover w-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                height={180}
                                width="100%"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                    )}

                    {/* Grid for remaining photos */}
                    {placeDetails.photos.length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                            {placeDetails.photos?.slice(1, 6).map((photo, index: number) => (
                                <div key={index + 1} className="relative aspect-square">
                                    <Image
                                        src={getPhotoUrl(photo.photoReference, 300)}
                                        alt={`${placeDetails.name} - Photo ${index + 2}`}
                                        className="rounded-lg object-cover w-full h-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                        width="100%"
                                        height="100%"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                            ))}

                            {/* Fill remaining slots if less than 5 photos */}
                            {(placeDetails.photos?.length || 0) < 6 && [...Array(Math.max(0, 5 - (placeDetails.photos?.length || 0)))].map((_, index) => (
                                <div key={`empty-${index}`} className="aspect-square"></div>
                            ))}
                        </div>
                    )}
                </div>
            </Image.PreviewGroup>
        </div>
    );
};

export default PhotosTab;