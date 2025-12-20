'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { GoogleMap as GoogleMapReact, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import MapBottomSheet from './MapBottomSheet'
import { Map as MapIcon } from 'lucide-react'
// import { Search, Layers, Bed } from 'lucide-react' // TODO: Uncomment when implementing these features
import { PlaceInfo } from '@/interfaces/itinerary.interface'
import { ItineraryWithEntries } from '@/interfaces/trip.interface'

// Google Maps style options
const MAP_STYLES = {
    roadmap: {
        name: 'Roadmap',
        mapTypeId: 'roadmap' as google.maps.MapTypeId
    },
    satellite: {
        name: 'Satellite',
        mapTypeId: 'satellite' as google.maps.MapTypeId
    },
    hybrid: {
        name: 'Hybrid',
        mapTypeId: 'hybrid' as google.maps.MapTypeId
    },
    terrain: {
        name: 'Terrain',
        mapTypeId: 'terrain' as google.maps.MapTypeId
    }
}

interface GoogleMapProps {
    itineraries: ItineraryWithEntries[]
}

const GoogleMap: React.FC<GoogleMapProps> = ({ itineraries }) => {
    const bangkokPosition = { lat: 13.7563, lng: 100.5018 }
    const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null | undefined>(null)
    const [selectedMapType, setSelectedMapType] = useState<keyof typeof MAP_STYLES>('roadmap')
    const [map, setMap] = useState<google.maps.Map | null>(null)

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    })

    // Extract all places from itinerary
    const allPlaces = React.useMemo(() => {
        if (!itineraries) return []
        const getEntries = itineraries.flatMap((itinerary: ItineraryWithEntries) => itinerary.entries)
        const filteredPlaces = getEntries.filter(item => item?.type === "place" && item.place)
        const places = filteredPlaces.map(item => item.place).filter((place): place is PlaceInfo => place !== undefined)

        return places
    }, [itineraries])

    // Calculate map center based on places
    const mapCenter = React.useMemo(() => {
        if (allPlaces.length === 0) return bangkokPosition

        const validPlaces = allPlaces.filter(p => p?.location?.latitude && p?.location?.longitude)
        if (validPlaces.length === 0) return bangkokPosition

        const avgLat = validPlaces.reduce((sum, p) => sum + (p?.location?.latitude ?? 0), 0) / validPlaces.length
        const avgLng = validPlaces.reduce((sum, p) => sum + (p?.location?.longitude ?? 0), 0) / validPlaces.length

        return { lat: avgLat, lng: avgLng }
    }, [allPlaces])

    const handlePlaceSelect = (place: PlaceInfo) => {
        setSelectedPlace(place)
        if (map && place.location?.latitude && place.location?.longitude) {
            map.panTo({ lat: place.location.latitude, lng: place.location.longitude })
        }
    }

    const handleMapTypeChange = (mapType: keyof typeof MAP_STYLES) => {
        setSelectedMapType(mapType)
        localStorage.setItem('google-map-type', mapType)
        if (map) {
            map.setMapTypeId(MAP_STYLES[mapType].mapTypeId)
        }
    }

    // Load saved map type on mount
    useEffect(() => {
        const savedMapType = localStorage.getItem('google-map-type') as keyof typeof MAP_STYLES
        if (savedMapType && MAP_STYLES[savedMapType]) {
            setSelectedMapType(savedMapType)
        }
    }, [])

    // Auto-select first place when data loads
    useEffect(() => {
        if (allPlaces.length > 0 && !selectedPlace) {
            setSelectedPlace(allPlaces[0])
        }
    }, [allPlaces, selectedPlace])

    // Pan to selected place when it changes
    useEffect(() => {
        if (map && selectedPlace?.location?.latitude && selectedPlace?.location?.longitude) {
            const position = {
                lat: selectedPlace.location.latitude,
                lng: selectedPlace.location.longitude
            }

            // Calculate offset to move pin higher (above bottom sheet)
            const scale = Math.pow(2, map.getZoom() || 13)
            const worldCoordinate = map.getProjection()?.fromLatLngToPoint(new google.maps.LatLng(position))

            if (worldCoordinate) {
                const pixelOffset = -250 // Move up 150 pixels
                const latOffset = pixelOffset / scale
                const newLat = position.lat + (latOffset * (256 / (map.getDiv()?.offsetHeight || 800)))

                map.panTo({ lat: newLat, lng: position.lng })
            } else {
                map.panTo(position)
            }

            map.setZoom(15)
        }
    }, [map, selectedPlace])

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map)
        map.setMapTypeId(MAP_STYLES[selectedMapType].mapTypeId)

        // Fit bounds to show all places
        if (allPlaces.length > 0) {
            const bounds = new google.maps.LatLngBounds()
            allPlaces.forEach(place => {
                if (place.location?.latitude && place.location?.longitude) {
                    bounds.extend({
                        lat: place.location.latitude,
                        lng: place.location.longitude
                    })
                }
            })
            map.fitBounds(bounds)
        }
    }, [selectedMapType, allPlaces])

    const onUnmount = useCallback(() => {
        setMap(null)
    }, [])

    if (!isLoaded) {
        return <div className="w-full h-full bg-gray-200 animate-pulse" />
    }

    return (
        <div className="w-full h-full relative">
            <GoogleMapReact
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={allPlaces.length > 0 ? 13 : 13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    mapTypeId: MAP_STYLES[selectedMapType].mapTypeId
                }}
            >
                {allPlaces.map((place) => {
                    if (!place.location?.latitude || !place.location?.longitude) {
                        console.log('❌ Place without location:', place.name)
                        return null
                    }

                    const position = {
                        lat: place.location.latitude,
                        lng: place.location.longitude
                    }

                    return (
                        <Marker
                            key={place.id}
                            position={position}
                            onClick={() => handlePlaceSelect(place)}
                        />
                    )
                })}
            </GoogleMapReact>
            <div className='absolute top-0 right-0 w-[10%] z-400 h-36'>
                <div className='flex flex-col items-end p-4 space-y-2'>
                    {/* TODO: Implement search functionality
                    <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                        <Search size={18} />
                    </div>
                    */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                                <MapIcon size={18} />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-64">
                            <div className="font-semibold mb-3">Choose Google Map Style</div>
                            <RadioGroup
                                value={selectedMapType}
                                onValueChange={(value) => handleMapTypeChange(value as keyof typeof MAP_STYLES)}
                            >
                                <div className="flex flex-col space-y-2">
                                    {Object.entries(MAP_STYLES).map(([key, style]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                            <RadioGroupItem value={key} id={key} />
                                            <Label htmlFor={key} className="cursor-pointer flex-1">
                                                {style.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </PopoverContent>
                    </Popover>
                    {/* TODO: Implement layers functionality
                    <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                        <Layers size={18} />
                    </div>
                    */}
                    {/* TODO: Implement accommodation search
                    <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                        <Bed size={18} />
                    </div>
                    */}
                </div>

            </div>
            {selectedPlace && (
                <div className="absolute bottom-15 left-1/2 transform -translate-x-1/2 z-400 w-[96%]">
                    <MapBottomSheet
                        selectedPlace={selectedPlace}
                        allPlaces={allPlaces}
                        onClose={() => setSelectedPlace(null)}
                        onPlaceChange={setSelectedPlace}
                    />
                </div>
            )}
        </div>
    )
}

export default GoogleMap
