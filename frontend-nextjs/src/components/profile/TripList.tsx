'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTripQueries'
import CreateTripModal from '../trip/CreateTripModal'
import TripCard from '../trip/TripCard'
import { Spinner } from '@/components/ui/spinner'
import { useTranslations } from 'next-intl'

interface TripListProps {
    userId: string | string[] | undefined;
    isOwnProfile: boolean;
}

type SortType = 'upcoming' | 'latest'

const TripList = ({ userId, isOwnProfile }: TripListProps) => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [sortType, setSortType] = useState<SortType>('upcoming')
    const t = useTranslations('profile.tripList')

    // Get userId string
    const userIdStr = Array.isArray(userId) ? userId[0] : userId

    // Use React Query hook - get trips where user is a member
    // For own profile: show all trips (draft + published)
    // For other profiles: show only published trips
    const {
        data: tripsResponse,
        isLoading: loading,
        refetch,
    } = useTrips({
        type: 'trip',
        memberId: userIdStr,
        status: isOwnProfile ? undefined : 'published'
    })

    const trips = tripsResponse?.trips || []

    // Sort trips based on selected sort type
    const sortedTrips = useMemo(() => {
        if (!trips || trips.length === 0) return []

        const tripsCopy = [...trips]

        if (sortType === 'upcoming') {
            // Sort by startDate ascending (soonest first)
            return tripsCopy.sort((a, b) =>
                new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            )
        } else {
            // Sort by createdAt descending (newest first)
            return tripsCopy.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        }
    }, [trips, sortType])

    // Show loading if auth is still loading
    if (authLoading) {
        return (
            <div>
                <div className='w-full flex justify-end'>
                    <CreateTripModal onSuccess={refetch} />
                </div>
                <div className='mt-4 flex justify-center py-8'>
                    <Spinner size="lg" />
                    <p className="ml-2 text-gray-500">{t('loading.auth')}</p>
                </div>
            </div>
        )
    }

    // Show sign in message if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div>
                <div className='w-full flex justify-end'>
                    <CreateTripModal onSuccess={refetch} />
                </div>
                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t('auth.title')}</h3>
                    <p className="text-gray-500">{t('auth.description')}</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div>
                <div className='w-full flex justify-end'>
                    <CreateTripModal onSuccess={refetch} />
                </div>
                <div className='mt-4 flex justify-center py-8'>
                    <Spinner size="lg" />
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className='w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0'>
                <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
                    <button
                        onClick={() => setSortType('upcoming')}
                        className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                            sortType === 'upcoming'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {t('sort.upcoming')}
                    </button>
                    <button
                        onClick={() => setSortType('latest')}
                        className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                            sortType === 'latest'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {t('sort.latest')}
                    </button>
                </div>

                {isOwnProfile && (
                    <div className="w-full sm:w-auto">
                        <CreateTripModal onSuccess={refetch} />
                    </div>
                )}
            </div>
            <div className='mt-4'>
                {sortedTrips && sortedTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedTrips.map((trip: any) => (
                            <TripCard key={trip.id} trip={trip} isClickable={isOwnProfile} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{t('empty.title')}</h3>
                        <p className="text-gray-500">{t('empty.description')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TripList
