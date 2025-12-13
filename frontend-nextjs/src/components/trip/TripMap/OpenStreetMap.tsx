'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import MapBottomSheet from './MapBottomSheet'
import { Search, Layers, Bed, Map as MapIcon } from 'lucide-react'
import { PlaceInfo } from '@/interfaces/itinerary.interface'
import { ItineraryWithEntries } from '@/interfaces/trip.interface'

// Dynamic import สำหรับ Map component ทั้งหมด
const LeafletMap = dynamic(
    () => import('./LeafletMapComponent'),
    {
        ssr: false,
        loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
    }
)

// Map Provider Configuration
const MAP_PROVIDERS = {
    google: {
        name: 'Google Maps',
        url: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
        free: false,
        requiresApiKey: true
    },
    google_satellite: {
        name: 'Google Satellite',
        url: `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
        free: false,
        requiresApiKey: true
    },
    google_hybrid: {
        name: 'Google Hybrid',
        url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
        free: false,
        requiresApiKey: true
    },
    osm: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        free: true
    },
    cartodb_light: {
        name: 'CartoDB Light',
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        free: true
    },
    cartodb_dark: {
        name: 'CartoDB Dark',
        url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        free: true
    },
    mapbox: {
        name: 'Mapbox Streets',
        url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> contributors',
        free: false,
        requiresApiKey: true
    },
    maptiler: {
        name: 'MapTiler Basic',
        url: 'https://api.maptiler.com/maps/basic-v2/256/{z}/{x}/{y}.png?key={key}',
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        free: false,
        requiresApiKey: true
    }
}

interface OpenStreetMapProps {
    itineraries: ItineraryWithEntries[]
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ itineraries }) => {
    const bangkokPosition: [number, number] = [13.7563, 100.5018]
    const [isClient, setIsClient] = useState(false)
    const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null | undefined>(null)
    const [selectedProvider, setSelectedProvider] = useState<string>('google')

    // Extract all places from itinerary
    const allPlaces = React.useMemo(() => {
        if (!itineraries) return []
        const getEntries = itineraries.flatMap((itinerary: ItineraryWithEntries) => itinerary.entries)
        const filteredPlaces = getEntries.filter(item => item?.type === "place" && item.place)
        const places = filteredPlaces.map(item => item.place).filter((place): place is PlaceInfo => place !== undefined)
        return places
    }, [itineraries])

    // Calculate map center based on places
    const mapCenter: [number, number] = React.useMemo(() => {
        if (allPlaces.length === 0) return bangkokPosition

        const validPlaces = allPlaces.filter(p => p?.location?.latitude && p?.location?.longitude)
        if (validPlaces.length === 0) return bangkokPosition

        // Calculate center of all places
        const avgLat = validPlaces.reduce((sum, p) => sum + (p?.location?.latitude ?? 0), 0) / validPlaces.length
        const avgLng = validPlaces.reduce((sum, p) => sum + (p?.location?.longitude ?? 0), 0) / validPlaces.length


        return [avgLat, avgLng]
    }, [allPlaces])

    const handlePlaceSelect = (place: PlaceInfo) => {
        setSelectedPlace(place)
    }

    const handleProviderChange = (providerId: string) => {
        setSelectedProvider(providerId)
        // Save to localStorage for persistence
        localStorage.setItem('map-provider', providerId)
    }

    // Load saved provider on mount
    useEffect(() => {
        const savedProvider = localStorage.getItem('map-provider')
        if (savedProvider && MAP_PROVIDERS[savedProvider as keyof typeof MAP_PROVIDERS]) {
            setSelectedProvider(savedProvider)
        }
    }, [])

    // Get current provider config
    const currentProvider = MAP_PROVIDERS[selectedProvider as keyof typeof MAP_PROVIDERS]

    // Auto-select first place when data loads
    useEffect(() => {
        if (allPlaces.length > 0 && !selectedPlace) {
            setSelectedPlace(allPlaces[0])
        }
    }, [allPlaces, selectedPlace])

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClient(true)
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    if (!isClient) {
        return <div className="w-full h-full bg-gray-200 animate-pulse" />
    }

    return (
        <div className="w-full h-full relative">
            <LeafletMap
                center={mapCenter}
                zoom={allPlaces.length > 0 ? 2 : 13}
                places={allPlaces}
                selectedPlaceId={selectedPlace?.id}
                selectedPlace={selectedPlace}
                onPlaceSelect={handlePlaceSelect}
                tileUrl={currentProvider?.url}
                attribution={currentProvider?.attribution}
            />
            <div className='absolute top-0 right-0 w-[10%] z-400 h-36'>
                <div className='flex flex-col items-end p-4 space-y-2'>
                    <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                        <Search size={18} />
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                                <MapIcon size={18} />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-64">
                            <div className="font-semibold mb-3">Choose Map Style</div>
                            <RadioGroup
                                value={selectedProvider}
                                onValueChange={handleProviderChange}
                            >
                                <div className="flex flex-col space-y-2">
                                    {Object.entries(MAP_PROVIDERS).map(([key, provider]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                            <RadioGroupItem value={key} id={key} />
                                            <Label htmlFor={key} className="cursor-pointer flex-1 flex justify-between items-center">
                                                <span>{provider.name}</span>
                                                <Badge variant={provider.free ? "default" : "secondary"} className="text-xs">
                                                    {provider.free ? 'Free' : 'API Key'}
                                                </Badge>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </PopoverContent>
                    </Popover>
                    <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                        <Layers size={18} />
                    </div>
                    <div className=' rounded-full h-8 w-8 bg-white/75 flex items-center justify-center cursor-pointer hover:bg-white/100'>
                        <Bed size={18} />
                    </div>
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

export default OpenStreetMap