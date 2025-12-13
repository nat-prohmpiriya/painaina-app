'use client'

import React from 'react'
import { useTripContext } from '@/contexts/TripContext'
import TripBanner from './TripBanner'
import ItinerarySection from './ItinerarySection'
import BudgetSection from './BudgetSection'
import ExploreGuide from './ExploreGuide'
import { TripBannerSkeleton, BudgetSkeleton } from '@/components/ui/SkeletonLoader'
import { useTranslations } from 'next-intl'

const TripDetail = () => {
    const { isLoading, error, tripData } = useTripContext()
    const t = useTranslations('tripDetail')

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-600">{t('errors.loadingError')}</h3>
                    <p className="text-gray-600 mt-2">{t('errors.tryAgainLater')}</p>
                </div>
            </div>
        )
    }

    if (!isLoading && !tripData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-600">{t('errors.notFound')}</h3>
                    <p className="text-gray-500 mt-2">{t('errors.notFoundDescription')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className='overflow-y-auto h-[calc(100vh-64px)] [&::-webkit-scrollbar]:hidden scrollbar-width-none'>
            {isLoading ? <TripBannerSkeleton /> : <TripBanner />}
            {!isLoading && tripData && <ExploreGuide />}
            <ItinerarySection />
            {isLoading ? <BudgetSkeleton /> : <BudgetSection />}
        </div>
    )
}

export default TripDetail