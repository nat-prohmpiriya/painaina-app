'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { useState } from 'react';
import { BookmarkPlus, ChevronRight, ArrowLeft } from "lucide-react";
import { PlaceInfo } from '@/interfaces/itinerary.interface';
import { useAuth } from '@/hooks/useAuth';
import { useTrips, useTrip } from '@/hooks/useTripQueries';
import { useCreateEntry } from '@/hooks/useItineraryQueries';
import { useToastMessage } from '@/contexts/ToastMessageContext';

interface AddToTripButtonProps {
    placeDetails: PlaceInfo | null
}

type Step = 'trips' | 'itineraries';

const AddToTripButton: React.FC<AddToTripButtonProps> = ({ placeDetails }) => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToastMessage();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('trips');
    const [selectedTripId, setSelectedTripId] = useState<string>();

    // Fetch user's trips
    const { data: tripsData, isLoading: isLoadingTrips } = useTrips({
        ownerId: user?.id || undefined
    });

    // Get selected trip full data (with itineraries)
    const { data: selectedTrip } = useTrip(selectedTripId || '');

    // Mutation for creating entry
    const createEntryMutation = useCreateEntry();

    const handleTripSelect = (tripId: string) => {
        setSelectedTripId(tripId);
        setStep('itineraries');
    };

    const handleBack = () => {
        setStep('trips');
        setSelectedTripId(undefined);
    };

    const handleItinerarySelect = async (itineraryId: string) => {
        if (!selectedTripId || !placeDetails) return;

        try {
            // Get the last order number for the selected itinerary
            const itinerary = selectedTrip?.itineraries?.find(it => it.id === itineraryId);
            const lastOrder = itinerary?.entries?.length || 0;

            await createEntryMutation.mutateAsync({
                tripId: selectedTripId,
                itineraryId: itineraryId,
                data: {
                    type: 'place',
                    title: placeDetails.name || 'Untitled Place',
                    place: placeDetails,
                    order: lastOrder,
                }
            });

            showSuccess(`Added to ${selectedTrip?.title}`);
            setOpen(false);
            setStep('trips');
            setSelectedTripId(undefined);
        } catch (error) {
            console.error('Error adding place to trip:', error);
            showError('Failed to add place to trip');
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset state when closing
            setStep('trips');
            setSelectedTripId(undefined);
        }
    };

    const renderTripsList = () => {
        if (isLoadingTrips) {
            return (
                <div className="flex justify-center items-center py-8">
                    <Spinner />
                </div>
            );
        }

        if (!tripsData?.trips || tripsData.trips.length === 0) {
            return (
                <Empty
                    description="No trips yet"
                    className="py-4"
                />
            );
        }

        return (
            <div className="space-y-1">
                {tripsData.trips.map((trip) => (
                    <div
                        key={trip.id}
                        onClick={() => handleTripSelect(trip.id)}
                        className="cursor-pointer hover:bg-gray-50 px-2 py-3 rounded transition-colors flex justify-between items-center"
                    >
                        <span className="font-medium">{trip.title}</span>
                        <ChevronRight className="text-gray-400 h-4 w-4" />
                    </div>
                ))}
            </div>
        );
    };

    const renderItinerariesList = () => {
        if (!selectedTrip) return null;

        const itineraries = selectedTrip.itineraries || [];

        if (itineraries.length === 0) {
            return (
                <Empty
                    description="No days in this trip"
                    className="py-4"
                />
            );
        }

        return (
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to trips
                </Button>
                {createEntryMutation.isPending ? (
                    <div className="flex justify-center items-center py-8">
                        <Spinner />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {itineraries.map((itinerary) => (
                            <div
                                key={itinerary.id}
                                onClick={() => handleItinerarySelect(itinerary.id)}
                                className="cursor-pointer hover:bg-gray-50 px-2 py-3 rounded transition-colors flex justify-between items-center"
                            >
                                <div>
                                    <div className="font-medium">
                                        Day {itinerary.dayNumber}
                                    </div>
                                    {itinerary.date && (
                                        <div className="text-xs text-gray-500">
                                            {itinerary.date}
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="text-gray-400 h-4 w-4" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className="rounded-full bg-red-500 hover:bg-red-600 text-white"
                    disabled={!placeDetails}
                >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    <span className='font-semibold'>Add To Trip</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 max-h-96 overflow-y-auto p-0 z-[9999]" side="bottom" align="start">
                <div className="p-4 border-b">
                    <h4 className="font-semibold">
                        {step === 'trips' ? 'Select Trip' : selectedTrip?.title}
                    </h4>
                </div>
                <div className="p-2">
                    {step === 'trips' ? renderTripsList() : renderItinerariesList()}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default AddToTripButton