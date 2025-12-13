'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Initialize Leaflet only on client side
const initializeLeaflet = async () => {
  if (typeof window !== 'undefined') {
    const L = await import('leaflet')
    // @ts-ignore - CSS import is handled in globals.css
    await import('leaflet/dist/leaflet.css')

    // Fix for default markers
    delete (L.default.Icon.Default.prototype as any)._getIconUrl
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }
}

interface GuideMapProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    title: string
    description?: string
  }>
  itinerary: any;
}

const GuideMap: React.FC<GuideMapProps> = ({
  center = [13.7563, 100.5018], // Default to Bangkok
  zoom = 13,
  markers = [],
  itinerary
}) => {
  const [isClient, setIsClient] = useState(false)
  const t = useTranslations('guideDetail')

  useEffect(() => {
    setIsClient(true)
    initializeLeaflet()
  }, [])

  // Don't render map on server side
  if (!isClient) {
    return (
      <div className='h-[calc(100vh-64px)] w-full flex items-center justify-center bg-gray-100'>
        <div className='text-gray-500'>{t('map.loading')}</div>
      </div>
    )
  }

  const places = [];
  return (
    <div className='h-[calc(100vh-64px)] w-full'>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className='h-full w-full'
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position}>
            <Popup>
              <div>
                <h3 className='font-semibold'>{marker.title}</h3>
                {marker.description && <p className='text-sm'>{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Default marker if no markers provided */}
        {markers.length === 0 && (
          <Marker position={center}>
            <Popup>
              <div>
                <h3 className='font-semibold'>Default Location</h3>
                <p className='text-sm'>Bangkok, Thailand</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export default GuideMap