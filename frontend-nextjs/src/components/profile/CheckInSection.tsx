'use client'

import React from 'react'
import { LuMapPin } from 'react-icons/lu'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

const Map = dynamic(() => import('react-leaflet').then((mod) => ({
    default: function MapComponent() {
        const { MapContainer, TileLayer } = mod
        return (
            <MapContainer
                center={[16.0, 108.0]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={true}
            >
                <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png"
                    attribution='© Stadia Maps © OpenMapTiles © OpenStreetMap'
                />
            </MapContainer>
        )
    }
})), {
    ssr: false,
    loading: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const t = useTranslations('profile.checkIn');
        return (
            <div className="h-full bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">{t('loadingMap')}</div>
            </div>
        )
    }
})

const CheckInSection = () => {
    const t = useTranslations('profile.checkIn');

    return (
        <div className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
            {/* Map Container - Responsive height */}
            <div className="relative h-64 md:h-80 lg:h-96">
                <Map />

                {/* Stats Bar - Responsive layout */}
                <div className="absolute top-2 left-2 md:left-4 bg-black/75 text-white p-2 md:p-3 rounded-lg shadow-lg z-[1000] flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 max-w-[calc(100%-5rem)] md:max-w-none">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="text-center">
                            <div className="text-base md:text-xl font-bold">3</div>
                            <div className="text-[10px] md:text-xs text-gray-300 uppercase tracking-wider whitespace-nowrap">{t('countries')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-base md:text-xl font-bold">6</div>
                            <div className="text-[10px] md:text-xs text-gray-300 uppercase tracking-wider whitespace-nowrap">{t('citiesRegions')}</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:ml-4">
                        <LuMapPin className="text-orange-400 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="text-xs md:text-sm font-medium">{t('badge')}</span>
                    </div>
                </div>

                {/* Add Visited Places Button - Responsive sizing */}
                <button className="absolute top-2 right-2 md:top-4 md:right-4 bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-md text-xs md:text-sm font-medium transition-colors z-[1000]">
                    <span className="hidden sm:inline">{t('addPlaces')}</span>
                    <span className="sm:hidden">{t('addPlacesMobile')}</span>
                </button>
            </div>
        </div>
    )
}

export default CheckInSection