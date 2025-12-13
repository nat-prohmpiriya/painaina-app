'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Button, Spin, Tag } from 'antd'
import { Plane, MapPin, DollarSign } from 'lucide-react'
import { useToastMessage } from '@/contexts/ToastMessageContext'

const { Title, Text } = Typography

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
        <Title level={3} className="flex items-center gap-2 mb-2">
          <Plane className="text-blue-500" size={24} />
          Popular Destinations from {origin}
        </Title>
        <Text type="secondary">
          Discover trending travel destinations with great prices
        </Text>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {routes.map((route, index) => (
            <Col xs={24} sm={12} lg={8} key={route.destination}>
              <Card 
                className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                hoverable
                data-testid={`destination-card-${route.destination}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <Text strong className="text-lg">{route.destination}</Text>
                    </div>
                    <Tag color={index < 3 ? 'gold' : 'blue'}>
                      #{index + 1}
                    </Tag>
                  </div>

                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign size={16} />
                    <Text strong className="text-xl">{route.price}</Text>
                    <Text type="secondary" className="text-sm">{currency}</Text>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <Text type="secondary">Airline:</Text>
                      <Text>{route.airline}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">Departure:</Text>
                      <Text>{formatDate(route.departure_at)}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">Return:</Text>
                      <Text>{formatDate(route.return_at)}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">Stops:</Text>
                      <Tag color={route.transfers === 0 ? 'green' : 'orange'}>
                        {getTransferText(route.transfers)}
                      </Tag>
                    </div>
                  </div>

                  <Button 
                    type="primary" 
                    block 
                    className="mt-4"
                    data-testid={`explore-btn-${route.destination}`}
                  >
                    Explore {route.destination}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {!loading && routes.length === 0 && (
        <div className="text-center py-8">
          <Text type="secondary">No popular destinations found for {origin}</Text>
        </div>
      )}
    </div>
  )
}