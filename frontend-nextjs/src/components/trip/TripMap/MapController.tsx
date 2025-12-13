'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { PlaceInfo } from '@/interfaces/itinerary.interface'

interface MapControllerProps {
    selectedPlace: PlaceInfo | null
}

const MapController: React.FC<MapControllerProps> = ({ selectedPlace }) => {
    const map = useMap()

    useEffect(() => {
        if (selectedPlace?.location?.latitude && selectedPlace?.location?.longitude) {
            const { latitude, longitude } = selectedPlace.location

            // Pan to the selected place with smooth animation
            map.flyTo([latitude, longitude], 15, {
                animate: true,
                duration: 1.0 // 1 second animation
            })
        }
    }, [selectedPlace, map])

    return null
}

export default MapController