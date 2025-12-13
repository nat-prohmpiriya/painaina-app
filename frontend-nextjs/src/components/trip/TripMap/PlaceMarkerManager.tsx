'use client'

import React from 'react'
import PlaceMarker from './PlaceMarker'
import { PlaceInfo } from '@/interfaces/itinerary.interface'

interface PlaceMarkerManagerProps {
  places: PlaceInfo[]
  selectedPlaceId?: string
  onPlaceSelect?: (place: PlaceInfo) => void
}

const PlaceMarkerManager: React.FC<PlaceMarkerManagerProps> = ({
  places,
  selectedPlaceId,
  onPlaceSelect
}) => {
  return (
    <>
      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          isSelected={place.id === selectedPlaceId}
          onClick={onPlaceSelect}
        />
      ))}
    </>
  )
}

export default PlaceMarkerManager