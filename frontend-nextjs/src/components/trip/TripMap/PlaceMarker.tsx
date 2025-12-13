'use client'

import React from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { PlaceInfo } from '@/interfaces/itinerary.interface'

interface PlaceMarkerProps {
  place: PlaceInfo
  onClick?: (place: PlaceInfo) => void
  isSelected?: boolean
}

// Custom marker icons based on place types
const createMarkerIcon = (placeTypes: string[], isSelected: boolean = false) => {
  let iconUrl = '/markers/default-marker.png'
  let iconColor = isSelected ? '#3B82F6' : '#EF4444' // Blue when selected, red default

  // Determine icon based on place types
  if (placeTypes.includes('restaurant') || placeTypes.includes('food')) {
    iconUrl = '/markers/restaurant-marker.png'
  } else if (placeTypes.includes('tourist_attraction')) {
    iconUrl = '/markers/attraction-marker.png'
  } else if (placeTypes.includes('lodging')) {
    iconUrl = '/markers/hotel-marker.png'
  } else if (placeTypes.includes('shopping_mall') || placeTypes.includes('store')) {
    iconUrl = '/markers/shopping-marker.png'
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${iconColor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        font-weight: bold;
        ${isSelected ? 'transform: scale(1.2);' : ''}
        transition: transform 0.2s ease;
      ">
        📍
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const PlaceMarker: React.FC<PlaceMarkerProps> = ({
  place,
  onClick,
  isSelected = false
}) => {
  if (!place || !place.location) {
    return null
  }

  const { latitude, longitude } = place.location

  if (!latitude || !longitude) {
    return null
  }

  const markerIcon = createMarkerIcon(place.categories || [], isSelected)

  const handleMarkerClick = () => {
    if (onClick) {
      onClick(place)
    }
  }

  return (
    <Marker
      position={[latitude, longitude]}
      icon={markerIcon}
      eventHandlers={{
        click: handleMarkerClick,
      }}
    />
  )
}

export default PlaceMarker