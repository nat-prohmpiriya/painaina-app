'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { guideService } from '@/services/guide.service'
import GuideCard from '@/components/guide/GuideCard'
import { useTranslations } from 'next-intl'
import type { TripDetailResponse } from '@/interfaces/trip.interface'

const ITEMS_PER_PAGE = 12

const GuideFeed = () => {
    const t = useTranslations('home.guideFeed')
    const loadMoreRef = useRef<HTMLDivElement>(null)

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteQuery({
        queryKey: ['guide-feed'],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await guideService.getPublishedGuides({
                limit: ITEMS_PER_PAGE,
                offset: pageParam,
            })
            return response
        },
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.reduce((acc, page) => acc + page.trips.length, 0)
            if (totalFetched < lastPage.meta.total) {
                return totalFetched
            }
            return undefined
        },
        initialPageParam: 0,
    })

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [target] = entries
            if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    )

    useEffect(() => {
        const element = loadMoreRef.current
        if (!element) return

        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '100px',
            threshold: 0,
        })

        observer.observe(element)
        return () => observer.disconnect()
    }, [handleObserver])

    const allGuides = data?.pages.flatMap((page) => page.trips) || []
    const totalGuides = data?.pages[0]?.meta.total || 0

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="min-h-screen flex justify-center items-center py-20">
                <div className="text-center">
                    <p className="text-red-500 mb-2">{t('error.title')}</p>
                    <p className="text-gray-600">{(error as Error)?.message || t('error.description')}</p>
                </div>
            </div>
        )
    }

    if (allGuides.length === 0) {
        return (
            <div className="min-h-screen flex justify-center items-center py-20">
                <Empty description={t('empty.description')} type="no-data" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-20">
            <div className="container mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
                    <p className="text-gray-600 mt-1">
                        {t('subtitle', { count: totalGuides })}
                    </p>
                </div>

                {/* Guide Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {allGuides.map((guide: TripDetailResponse) => (
                        <GuideCard key={guide.id} guide={guide} />
                    ))}
                </div>

                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isFetchingNextPage && <Spinner />}
                    {!hasNextPage && allGuides.length > 0 && (
                        <p className="text-gray-500">{t('endOfList')}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GuideFeed
