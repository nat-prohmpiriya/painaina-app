'use client'

import React from 'react'
import GoogleMap from './GoogleMap'
import { useTripContext } from '@/contexts/TripContext'

const TripMap = () => {
    const { itineraries } = useTripContext()

    return (
        <>
            <GoogleMap itineraries={itineraries || []} />
        </>
    )
}

export default TripMap