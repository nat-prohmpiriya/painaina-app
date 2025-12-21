'use client'

import React, { useMemo } from 'react'
import { LuMapPin } from 'react-icons/lu'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useUserCheckIns } from '@/hooks/useCheckInQueries'
import { Skeleton } from '@/components/ui/skeleton'
import AddCheckInModal from './AddCheckInModal'

// Dynamic import of Map with markers support
const MapWithMarkers = dynamic(() => import('react-leaflet').then(async (mod) => {
    const { MapContainer, TileLayer, Marker, Popup } = mod
    const L = await import('leaflet')

    // Create custom marker icon
    const createPinIcon = (color: string = '#3b82f6') => {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 24px;
                height: 24px;
                background: ${color};
                border: 2px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24],
        })
    }

    const pinIcon = createPinIcon('#3b82f6')

    return function MapComponent({ checkins }: { checkins: Array<{ city: string; countryFlag: string; latitude: number; longitude: number }> }) {
        // Calculate center based on checkins or default to Asia
        const center = useMemo(() => {
            if (checkins.length === 0) return [16.0, 108.0] as [number, number]
            const avgLat = checkins.reduce((sum, c) => sum + c.latitude, 0) / checkins.length
            const avgLng = checkins.reduce((sum, c) => sum + c.longitude, 0) / checkins.length
            return [avgLat, avgLng] as [number, number]
        }, [checkins])

        return (
            <MapContainer
                center={center}
                zoom={checkins.length > 0 ? 4 : 5}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {checkins.map((checkin, index) => (
                    <Marker
                        key={index}
                        position={[checkin.latitude, checkin.longitude]}
                        icon={pinIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <span className="text-lg">{checkin.countryFlag}</span>
                                <div className="font-medium">{checkin.city}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        )
    }
}), {
    ssr: false,
    loading: () => {
        return (
            <div className="h-full bg-gray-100 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
            </div>
        )
    }
})

interface CheckInSectionProps {
    userId?: string
    isOwnProfile?: boolean
}

const CheckInSection = ({ userId, isOwnProfile = true }: CheckInSectionProps) => {
    const t = useTranslations('profile.checkIn')
    const { data, isLoading } = useUserCheckIns(userId)

    const stats = data?.stats
    const checkins = data?.checkins || []

    // Prepare markers data for map
    const markers = useMemo(() => {
        return checkins.map(c => ({
            city: c.city,
            countryFlag: c.countryFlag,
            latitude: c.latitude,
            longitude: c.longitude,
        }))
    }, [checkins])

    return (
        <div className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
            {/* Map Container - Responsive height */}
            <div className="relative h-64 md:h-80 lg:h-96">
                <MapWithMarkers checkins={markers} />

                {/* Stats Bar - Responsive layout */}
                <div className="absolute top-2 left-2 md:left-4 bg-black/75 text-white p-2 md:p-3 rounded-lg shadow-lg z-[500] flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 max-w-[calc(100%-5rem)] md:max-w-none">
                    {isLoading ? (
                        <div className="flex items-center gap-3 md:gap-6">
                            <Skeleton className="h-8 w-12 bg-white/20" />
                            <Skeleton className="h-8 w-12 bg-white/20" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 md:gap-6">
                                <div className="text-center">
                                    <div className="text-base md:text-xl font-bold">{stats?.totalCountries || 0}</div>
                                    <div className="text-[10px] md:text-xs text-gray-300 uppercase tracking-wider whitespace-nowrap">{t('countries')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-base md:text-xl font-bold">{stats?.totalCities || 0}</div>
                                    <div className="text-[10px] md:text-xs text-gray-300 uppercase tracking-wider whitespace-nowrap">{t('citiesRegions')}</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Add Visited Places Button - Only show for own profile */}
                {isOwnProfile && (
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[500]">
                        <AddCheckInModal />
                    </div>
                )}
            </div>
        </div>
    )
}

export default CheckInSection
