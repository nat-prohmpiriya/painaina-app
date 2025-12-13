'use client'

import React from 'react'
import GuideItineraryItem from './GuideItineraryItem'
import { ItineraryWithEntries } from '@/interfaces/trip.interface'

interface ItinerarySectionProps {
    itinerary: ItineraryWithEntries[] | null;
}

const ItinerarySection: React.FC<ItinerarySectionProps> = ({ itinerary }) => {
    if (!itinerary || !itinerary.length) {
        return (
            <div className="p-4 text-center text-gray-500">
                No itinerary available for this guide.
            </div>
        )
    }

    return (
        <div className=''>
            {itinerary.map((day) => (
                <GuideItineraryItem key={day.id} day={day} />
            ))}
        </div>
    )
}

export default ItinerarySection