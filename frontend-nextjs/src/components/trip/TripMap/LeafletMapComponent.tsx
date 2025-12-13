'use client'

import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import PlaceMarkerManager from './PlaceMarkerManager'
import MapController from './MapController'
import { PlaceInfo } from '@/interfaces/itinerary.interface'

interface LeafletMapComponentProps {
    center: [number, number]
    zoom: number
    places?: PlaceInfo[]
    selectedPlaceId?: string
    selectedPlace?: PlaceInfo | null
    onPlaceSelect?: (place: PlaceInfo) => void
    tileUrl?: string
    attribution?: string
}

const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({ 
    center, 
    zoom, 
    places = [], 
    selectedPlaceId,
    selectedPlace,
    onPlaceSelect,
    tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}) => {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution={attribution}
                url={tileUrl}
            />
            
            {/* Map Controller for handling pan/zoom */}
            <MapController selectedPlace={selectedPlace || null} />
            
            {places.length > 0 && (
                <PlaceMarkerManager
                    places={places}
                    selectedPlaceId={selectedPlaceId}
                    onPlaceSelect={onPlaceSelect}
                />
            )}
        </MapContainer>
    )
}

export default LeafletMapComponent