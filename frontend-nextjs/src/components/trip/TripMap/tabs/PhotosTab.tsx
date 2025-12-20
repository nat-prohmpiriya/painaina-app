'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { PlaceInfo } from '@/interfaces/itinerary.interface'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PhotosTabProps {
    placeDetails: PlaceInfo | undefined
}

const PhotosTab: React.FC<PhotosTabProps> = ({ placeDetails }) => {
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

    // Get photo URL from API proxy
    const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
        console.log('Photo Reference:', photoReference);
        if (!photoReference) return `https://via.placeholder.com/${maxWidth}x${Math.floor(maxWidth * 0.75)}?text=No+Image`;
        return `${process.env.NEXT_PUBLIC_API_URL}/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`;
    };

    const openPreview = (index: number) => setSelectedPhotoIndex(index)
    const closePreview = () => setSelectedPhotoIndex(null)
    const goToPrevious = () => {
        if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
            setSelectedPhotoIndex(selectedPhotoIndex - 1)
        }
    }
    const goToNext = () => {
        if (selectedPhotoIndex !== null && placeDetails?.photos && selectedPhotoIndex < placeDetails.photos.length - 1) {
            setSelectedPhotoIndex(selectedPhotoIndex + 1)
        }
    }

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
        <>
            <div className="px-2 pb-2 -mt-2 overflow-y-auto max-h-[35vh]">
                <div className="space-y-2">
                    {/* Large featured photo - Full width */}
                    {placeDetails.photos.slice(0, 1)[0] && (
                        <div
                            className="w-full relative h-[180px] cursor-pointer"
                            onClick={() => openPreview(0)}
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
                                    onClick={() => openPreview(index + 1)}
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
            </div>

            {/* Image Preview Dialog */}
            <Dialog open={selectedPhotoIndex !== null} onOpenChange={(open) => !open && closePreview()}>
                <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                    <DialogTitle className="sr-only">Image Preview</DialogTitle>
                    {selectedPhotoIndex !== null && placeDetails.photos && (
                        <div className="relative">
                            {/* Header */}
                            <div className="absolute top-2 left-4 z-10 text-white text-sm bg-black/50 px-2 py-1 rounded">
                                {selectedPhotoIndex + 1} / {placeDetails.photos.length}
                            </div>

                            {/* Image */}
                            <div className="relative w-full h-[80vh]">
                                <Image
                                    src={getPhotoUrl(placeDetails.photos[selectedPhotoIndex].photoReference, 600)}
                                    alt={`${placeDetails.name} - Photo ${selectedPhotoIndex + 1}`}
                                    fill
                                    className="object-contain"
                                />
                            </div>

                            {/* Previous button */}
                            {selectedPhotoIndex > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                                    onClick={goToPrevious}
                                >
                                    <ChevronLeft size={32} />
                                </Button>
                            )}

                            {/* Next button */}
                            {selectedPhotoIndex < placeDetails.photos.length - 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                                    onClick={goToNext}
                                >
                                    <ChevronRight size={32} />
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PhotosTab;
