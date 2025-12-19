'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { LuMapPin, LuSearch } from "react-icons/lu"
import { FooterSection } from '@/components/landing'
import { useTrips } from "@/hooks/useTripQueries"
import { useAuth } from "@/hooks/useAuth"
import TripCard from "@/components/trip/TripCard"
import GuideCard from "@/components/guide/GuideCard"
import CreateTripModal from "@/components/trip/CreateTripModal"
import CreateGuideModal from "@/components/guide/CreateGuideModal"
import { useTranslations } from 'next-intl'

const TripsPage = () => {
    const { user, isAuthenticated } = useAuth()
    const t = useTranslations('trips')

    // Fetch user's trips (type: 'trip')
    const {
        data: tripsResponse,
        isLoading: tripsLoading,
        refetch: refetchTrips,
    } = useTrips({
        type: 'trip',
        memberId: user?.id,
    })

    // Fetch user's guides (type: 'guide')
    const {
        data: guidesResponse,
        isLoading: guidesLoading,
        refetch: refetchGuides,
    } = useTrips({
        type: 'guide',
        memberId: user?.id,
    })

    const trips = tripsResponse?.trips || []
    const guides = guidesResponse?.trips || []

    // Get recent trips (limit to 4 for display)
    const recentTrips = trips.slice(0, 4)

    return (
        <div >
            <div className='container mx-auto px-4 md:px-6'>
                {/* Header - Responsive */}
                <div className='mt-4 md:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0'>
                    <h1 className='text-lg md:text-2xl font-semibold'>{t('header.title')}</h1>
                    <CreateTripModal onSuccess={refetchTrips} />
                </div>
                <div className="flex justify-between mb-4 mt-2">
                    <Button variant="ghost" className="rounded-full">
                        <span className="text-gray-500 text-xs md:text-sm font-bold">{t('header.recentlyViewed')}</span>
                    </Button>
                    <Button variant="ghost" className="rounded-full">
                        <span className="text-gray-500 text-xs md:text-sm font-bold">{t('header.seeAll')}</span>
                    </Button>
                </div>
                {/* Horizontal Scroll - Recently Viewed */}
                {tripsLoading ? (
                    <div className='flex justify-center py-8'>
                        <Spinner size="lg" />
                    </div>
                ) : recentTrips.length > 0 ? (
                    <div className="relative">
                        <div className="overflow-x-auto scrollbar-hide">
                            <div className="flex gap-4 pb-4">
                                {recentTrips.map((trip) => (
                                    <div key={trip.id} className="flex-shrink-0 w-[280px] sm:w-[320px]">
                                        <TripCard trip={trip} isClickable={true} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{t('emptyState.noTrips.title')}</h3>
                        <p className="text-gray-500">{t('emptyState.noTrips.description')}</p>
                    </div>
                )}
                {/* Search Form - Responsive */}
                <div className="bg-gray-100 p-3 md:p-4 rounded-2xl mt-6 md:mt-8">
                    <h3 className="text-base md:text-lg font-semibold mb-3">{t('accommodation.title')}</h3>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                        <div className="relative flex-1">
                            <LuMapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('accommodation.searchPlaceholder')}
                                className="pl-10 h-10 rounded-2xl"
                            />
                        </div>
                        <Input
                            placeholder="Select dates"
                            className="flex-1 h-10 rounded-2xl"
                        />
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="lg" className="rounded-full flex-1 md:flex-initial">
                                        <span className="text-xs font-bold">{t('accommodation.travelers')}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    {/* Add travelers content here */}
                                </PopoverContent>
                            </Popover>
                            <Button size="lg" className="rounded-full flex-1 md:flex-initial">
                                <LuSearch size={20} />
                                <span className="text-xs font-bold">{t('accommodation.search')}</span>
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Add visited places - Responsive */}
                <div className="w-full bg-gray-100 p-3 md:p-4 rounded-2xl mt-6 md:mt-8 min-h-[200px]">
                    <h3 className="text-base md:text-lg font-semibold">{t('visitedPlaces.title')}</h3>
                </div>

                {/* Tabs Section - Responsive */}
                <div className="w-full mt-6 md:mt-8 mb-8 md:mb-16">
                    <Tabs defaultValue="trips" className="w-full">
                        <TabsList>
                            <TabsTrigger value="trips">
                                <span className="text-xs md:text-sm font-bold">{t('tabs.trips')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="guides">
                                <span className="text-xs md:text-sm font-bold">{t('tabs.guides')}</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="trips">
                            <div>
                                <div className="flex justify-end items-center mb-4">
                                    <CreateTripModal onSuccess={refetchTrips} />
                                </div>
                                {/* Responsive Grid: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols large */}
                                {tripsLoading ? (
                                    <div className='flex justify-center py-8'>
                                        <Spinner size="lg" />
                                    </div>
                                ) : trips.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {trips.map((trip) => (
                                            <TripCard key={trip.id} trip={trip} isClickable={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-500 mb-4">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">{t('emptyState.noTrips.title')}</h3>
                                        <p className="text-gray-500">{t('emptyState.noTrips.description')}</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="guides">
                            <div>
                                <div className="flex justify-end items-center mb-4">
                                    <CreateGuideModal onSuccess={refetchGuides} />
                                </div>
                                {/* Responsive Grid: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols large */}
                                {guidesLoading ? (
                                    <div className='flex justify-center py-8'>
                                        <Spinner size="lg" />
                                    </div>
                                ) : guides.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {guides.map((guide) => (
                                            <GuideCard key={guide.id} guide={guide} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-500 mb-4">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">{t('emptyState.noGuides.title')}</h3>
                                        <p className="text-gray-500">{t('emptyState.noGuides.description')}</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <FooterSection />
        </div>
    )
}

export default TripsPage
