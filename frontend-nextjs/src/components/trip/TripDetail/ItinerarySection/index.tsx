'use client'

import React from 'react'
import ItineraryItem from './ItineraryItem'
import { useTripContext } from '@/contexts/TripContext'
import { PhotoUrlProvider } from './PhotoUrlContext'
import { ItinerarySkeleton } from '@/components/ui/SkeletonLoader'

const ItinerarySection = () => {
    const { itineraries, isLoading, tripData } = useTripContext()

    if (isLoading) {
        return <ItinerarySkeleton />
    }

    if (!itineraries || itineraries.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                {tripData?.type === 'guide'
                    ? 'No days added yet. Start building your guide!'
                    : 'No itinerary available.'
                }
            </div>
        )
    }

    return (
        <PhotoUrlProvider>
            <div>
                {itineraries.map((itinerary) => (
                    <ItineraryItem
                        key={itinerary.id}
                        day={itinerary}
                        isGuidePage={tripData?.type === 'guide'}
                    />
                ))}
            </div>
        </PhotoUrlProvider>
    )
}

export default ItinerarySection