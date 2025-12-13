'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import Image from 'next/image'
import { useState } from 'react'
import { PlaceInfo } from '@/interfaces/itinerary.interface'

interface PhotosTabProps {
    placeDetails: PlaceInfo | undefined
}

const PhotosTab: React.FC<PhotosTabProps> = ({ placeDetails }) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    // Get photo URL from API
    const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
        if (!photoReference) return `https://via.placeholder.com/${maxWidth}x${Math.floor(maxWidth * 0.75)}?text=No+Image`;
        return `${process.env.NEXT_PUBLIC_API_URL}/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`;
    };

    const handlePreview = (photoUrl: string) => {
        setPreviewImage(photoUrl);
        setPreviewOpen(true);
    };

    if (!placeDetails) {
        return (
            <div className="p-3 overflow-y-auto max-h-80 space-y-2">
                <Skeleton className="w-full h-[180px] rounded-xl" />
                <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-[100px] rounded-lg" />
                    <Skeleton className="h-[100px] rounded-lg" />
                    <Skeleton className="h-[100px] rounded-lg" />
                </div>
            </div>
        );
    }

    if (!placeDetails?.photos || placeDetails.photos.length === 0) {
        return (
            <div className="p-3 overflow-y-auto max-h-80">
                <Empty description="No photos available for this place" />
            </div>
        );
    }

    return (
        <div className="px-2 pb-2 -mt-2 overflow-y-auto max-h-[35vh]">
            <div className="space-y-2">
                {/* Large featured photo - Full width */}
                {placeDetails.photos.slice(0, 1)[0] && (
                    <div
                        className="w-full relative h-[180px] cursor-pointer"
                        onClick={() => handlePreview(getPhotoUrl(placeDetails.photos[0].photoReference, 600))}
                    >
                        <Image
                            src={getPhotoUrl(placeDetails.photos[0].photoReference, 600)}
                            alt={`${placeDetails.name} - Photo 1`}
                            fill
                            className="rounded-xl object-cover shadow-sm hover:shadow-md transition-shadow"
                        />
                    </div>
                )}

                {/* Grid for remaining photos */}
                {placeDetails.photos.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                        {placeDetails.photos?.slice(1, 6).map((photo, index: number) => (
                            <div
                                key={index + 1}
                                className="relative aspect-square cursor-pointer"
                                onClick={() => handlePreview(getPhotoUrl(photo.photoReference, 600))}
                            >
                                <Image
                                    src={getPhotoUrl(photo.photoReference, 300)}
                                    alt={`${placeDetails.name} - Photo ${index + 2}`}
                                    fill
                                    className="rounded-lg object-cover shadow-sm hover:shadow-md transition-shadow"
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

            {/* Image Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl">
                    {previewImage && (
                        <div className="relative w-full h-[80vh]">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PhotosTab;