'use client'

import React, { useMemo } from 'react'
import { LuMapPin } from 'react-icons/lu'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useUserCheckIns } from '@/hooks/useCheckInQueries'
import { Skeleton } from '@/components/ui/skeleton'
import AddCheckInModal from './AddCheckInModal'

// Dynamic import of Map with markers support
const MapWithMarkers = dynamic(() => import('react-leaflet').then((mod) => {
    const { MapContainer, TileLayer, Marker, Popup } = mod

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
                    url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png"
                    attribution='&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap'
                />
                {checkins.map((checkin, index) => (
                    <Marker
                        key={index}
                        position={[checkin.latitude, checkin.longitude]}
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
                <div className="absolute top-2 left-2 md:left-4 bg-black/75 text-white p-2 md:p-3 rounded-lg shadow-lg z-[10] flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 max-w-[calc(100%-5rem)] md:max-w-none">
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
                            {(stats?.totalCountries || 0) >= 3 && (
                                <div className="flex items-center space-x-2 md:ml-4">
                                    <LuMapPin className="text-orange-400 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                                    <span className="text-xs md:text-sm font-medium">{t('badge')}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Add Visited Places Button - Only show for own profile */}
                {isOwnProfile && (
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[10]">
                        <AddCheckInModal />
                    </div>
                )}
            </div>

            {/* Recent Check-ins List */}
            {checkins.length > 0 && (
                <div className="p-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('recentPlaces')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {checkins.slice(0, 8).map((checkin) => (
                            <div
                                key={checkin.id}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-full text-sm"
                            >
                                <span>{checkin.countryFlag}</span>
                                <span className="font-medium">{checkin.city}</span>
                            </div>
                        ))}
                        {checkins.length > 8 && (
                            <div className="flex items-center px-2.5 py-1.5 text-sm text-muted-foreground">
                                +{checkins.length - 8} {t('more')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CheckInSection
