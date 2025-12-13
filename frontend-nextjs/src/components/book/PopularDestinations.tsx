'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tag } from '@/components/ui/tag'
import { Plane, MapPin, DollarSign } from 'lucide-react'
import { useToastMessage } from '@/contexts/ToastMessageContext'

interface PopularDestinationsProps {
  origin?: string
  currency?: string
  limit?: number
}

interface RouteData {
  destination: string
  price: number
  airline: string
  departure_at: string
  return_at: string
  transfers: number
}

export default function PopularDestinations({ 
  origin = 'BKK', 
  currency = 'USD',
  limit = 6 
}: PopularDestinationsProps) {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(false)
  const { showError } = useToastMessage()

  useEffect(() => {
    fetchPopularRoutes()
  }, [origin, currency])

  const fetchPopularRoutes = async () => {
    setLoading(true)
    try {
      // TODO: Implement travelPayoutService
      console.warn('TravelPayout service not implemented')
      setRoutes([])
    } catch (error) {
      showError('Failed to load popular destinations', String(error))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getTransferText = (transfers: number) => {
    if (transfers === 0) return 'Direct'
    if (transfers === 1) return '1 Stop'
    return `${transfers} Stops`
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 mb-2 text-xl font-semibold">
          <Plane className="text-blue-500" size={24} />
          Popular Destinations from {origin}
        </h3>
        <p className="text-sm text-muted-foreground">
          Discover trending travel destinations with great prices
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route, index) => (
            <div
              key={route.destination}
              className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-shadow cursor-pointer p-6"
              data-testid={`destination-card-${route.destination}`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="text-lg font-semibold">{route.destination}</span>
                  </div>
                  <Tag variant={index < 3 ? 'warning' : 'info'}>
                    #{index + 1}
                  </Tag>
                </div>

                <div className="flex items-center gap-1 text-green-600">
                  <DollarSign size={16} />
                  <span className="text-xl font-semibold">{route.price}</span>
                  <span className="text-sm text-muted-foreground">{currency}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Airline:</span>
                    <span>{route.airline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure:</span>
                    <span>{formatDate(route.departure_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Return:</span>
                    <span>{formatDate(route.return_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stops:</span>
                    <Tag variant={route.transfers === 0 ? 'success' : 'warning'}>
                      {getTransferText(route.transfers)}
                    </Tag>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  data-testid={`explore-btn-${route.destination}`}
                >
                  Explore {route.destination}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && routes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No popular destinations found for {origin}</p>
        </div>
      )}
    </div>
  )
}