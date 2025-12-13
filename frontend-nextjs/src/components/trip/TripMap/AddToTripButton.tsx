'use client'

import { Button, Popover, Spin, Empty, List, message } from 'antd'
import { useState } from 'react';
import { LuBookmarkPlus, LuChevronRight } from "react-icons/lu";
import { PlaceInfo } from '@/interfaces/itinerary.interface';
import { useAuth } from '@/hooks/useAuth';
import { IoArrowBackOutline } from "react-icons/io5";
import { useTrips, useTrip } from '@/hooks/useTripQueries';
import { useCreateEntry } from '@/hooks/useItineraryQueries';

interface AddToTripButtonProps {
    placeDetails: PlaceInfo | null
}

type Step = 'trips' | 'itineraries';

const AddToTripButton: React.FC<AddToTripButtonProps> = ({ placeDetails }) => {
    const { user } = useAuth();
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

            message.success(`Added to ${selectedTrip?.title}`);
            setOpen(false);
            setStep('trips');
            setSelectedTripId(undefined);
        } catch (error) {
            console.error('Error adding place to trip:', error);
            message.error('Failed to add place to trip');
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
                    <Spin />
                </div>
            );
        }

        if (!tripsData?.trips || tripsData.trips.length === 0) {
            return (
                <Empty
                    description="No trips yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="py-4"
                />
            );
        }

        return (
            <List
                size="small"
                dataSource={tripsData.trips}
                renderItem={(trip) => (
                    <List.Item
                        onClick={() => handleTripSelect(trip.id)}
                        className="cursor-pointer hover:bg-gray-50 px-2 py-3 rounded transition-colors"
                    >
                        <div className="flex justify-between items-center w-full">
                            <span className="font-medium">{trip.title}</span>
                            <LuChevronRight className="text-gray-400" />
                        </div>
                    </List.Item>
                )}
            />
        );
    };

    const renderItinerariesList = () => {
        if (!selectedTrip) return null;

        const itineraries = selectedTrip.itineraries || [];

        if (itineraries.length === 0) {
            return (
                <Empty
                    description="No days in this trip"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="py-4"
                />
            );
        }

        return (
            <div>
                <Button
                    type="text"
                    size="small"
                    onClick={handleBack}
                    className="mb-2"
                    icon={<IoArrowBackOutline />}
                >
                    Back to trips
                </Button>
                <List
                    size="small"
                    dataSource={itineraries}
                    renderItem={(itinerary) => (
                        <List.Item
                            onClick={() => handleItinerarySelect(itinerary.id)}
                            className="cursor-pointer hover:bg-gray-50 px-2 py-3 rounded transition-colors"
                        >
                            <div className="flex justify-between items-center w-full">
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
                                <LuChevronRight className="text-gray-400" />
                            </div>
                        </List.Item>
                    )}
                    loading={createEntryMutation.isPending}
                />
            </div>
        );
    };

    const content = (
        <div className="w-72 max-h-96 overflow-y-auto">
            {step === 'trips' ? renderTripsList() : renderItinerariesList()}
        </div>
    );

    return (
        <Popover
            content={content}
            title={step === 'trips' ? 'Select Trip' : selectedTrip?.title}
            trigger="click"
            open={open}
            onOpenChange={handleOpenChange}
        >
            <Button
                icon={<LuBookmarkPlus size={18} className='mt-1' />}
                color='danger'
                variant='solid'
                shape='round'
                disabled={!placeDetails}
            >
                <span className='font-semibold'>Add To Trip</span>
            </Button>
        </Popover>
    )
}

export default AddToTripButton