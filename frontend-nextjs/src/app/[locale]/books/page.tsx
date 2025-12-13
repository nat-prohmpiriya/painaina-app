'use client'

import { Divider } from 'antd'
import SearchGuidesForm from '@/components/book/SearchFlightsForm'
import PopularDestinations from '@/components/book/PopularDestinations'
import PriceTrends from '@/components/book/PriceTrends'
import RouteComparison from '@/components/book/RouteComparison'
import { imgUrl } from '@/lib/imgUrl'

const BookingPage = () => {
  return (
    <div className=''>
      {/* Hero Section */}
      <div style={{ backgroundImage: `url(${imgUrl})` }} className='h-[50vh] bg-cover bg-center flex items-center justify-center'>
        <SearchGuidesForm />
      </div>

      {/* Travel Insights Section */}
      <div className='max-w-7xl mx-auto px-4 py-8 space-y-12'>
        
        {/* Popular Destinations */}
        <section data-testid="popular-destinations-section">
          <PopularDestinations origin="BKK" currency="USD" limit={6} />
        </section>

        <Divider />

        {/* Route Comparison */}
        <section data-testid="route-comparison-section">
          <RouteComparison />
        </section>

        <Divider />

        {/* Price Trends */}
        <section data-testid="price-trends-section">
          <PriceTrends origin="BKK" destination="HKT" currency="USD" />
        </section>

      </div>
    </div>
  )
}

export default BookingPage