'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pagination, Spin, Empty } from 'antd'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { guideService, type SearchGuidesQuery } from '@/services/guide.service'
import SearchGuidesForm from '@/components/guide/SearchGuidesForm'
import type { Trip } from '@/interfaces'

const ITEMS_PER_PAGE = 12

const GuidesSearch = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentPage, setCurrentPage] = useState(1)

    // Parse query parameters
    const initialQuery: SearchGuidesQuery = {
        q: searchParams.get('q') || undefined,
        tags: searchParams.get('tags') || undefined,
        status: (searchParams.get('status') as 'draft' | 'published') || 'published',
        limit: ITEMS_PER_PAGE,
        offset: 0
    }

    const [searchQuery, setSearchQuery] = useState<SearchGuidesQuery>(initialQuery)

    // Fetch guides with query
    const { data, isLoading, error } = useQuery({
        queryKey: ['guides-search', searchQuery],
        queryFn: () => guideService.searchGuides({
            ...searchQuery,
            offset: (currentPage - 1) * ITEMS_PER_PAGE
        }),
    })

    // Update URL when search query changes
    const updateURL = (query: SearchGuidesQuery) => {
        const params = new URLSearchParams()
        if (query.q) params.set('q', query.q)
        if (query.tags) params.set('tags', query.tags)
        if (query.status) params.set('status', query.status)

        router.push(`/guides/search?${params.toString()}`)
    }

    const handleSearch = (query: SearchGuidesQuery) => {
        // Always force published status for public search
        setSearchQuery({ ...query, status: 'published', limit: ITEMS_PER_PAGE, offset: 0 })
        setCurrentPage(1)
        updateURL(query)
    }

    const handleClear = () => {
        const clearedQuery: SearchGuidesQuery = {
            status: 'published',
            limit: ITEMS_PER_PAGE,
            offset: 0
        }
        setSearchQuery(clearedQuery)
        setCurrentPage(1)
        router.push('/guides/search')
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const guides = data?.trips || []
    const total = data?.meta.total || 0

    return (
        <div className='min-h-screen bg-gray-50 pt-20 pb-16'>
            <div className='container mx-auto px-4 md:px-6'>
                {/* Search Form */}
                <div className='mb-6'>
                    <SearchGuidesForm
                        initialQuery={searchQuery}
                        onSearch={handleSearch}
                        onClear={handleClear}
                    />
                </div>

                {/* Results Count */}
                <div className='mb-4'>
                    <h2 className='text-2xl md:text-3xl font-bold'>
                        Search Results
                    </h2>
                    <p className='text-gray-600 mt-1'>
                        {isLoading ? 'Searching...' : `Found ${total} guide${total !== 1 ? 's' : ''}`}
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className='flex justify-center items-center py-20'>
                        <Spin size='large' />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className='flex justify-center items-center py-20'>
                        <div className='text-center'>
                            <p className='text-red-500 mb-2'>Error loading guides</p>
                            <p className='text-gray-600'>{error.message}</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && guides.length === 0 && (
                    <div className='flex justify-center items-center py-20'>
                        <Empty
                            description={
                                <span className='text-gray-600'>
                                    No guides found. Try adjusting your search filters.
                                </span>
                            }
                        />
                    </div>
                )}

                {/* Results Grid */}
                {!isLoading && !error && guides.length > 0 && (
                    <>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8'>
                            {guides.map((guide: Trip) => (
                                <div
                                    key={guide.id}
                                    className='bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300'
                                    onClick={() => router.push(`/guides/${guide.id}`)}
                                >
                                    {/* Cover Image */}
                                    <div className='relative h-48 w-full bg-gray-200'>
                                        {guide.coverPhoto ? (
                                            <Image
                                                src={guide.coverPhoto}
                                                alt={guide.title}
                                                fill
                                                className='object-cover'
                                            />
                                        ) : (
                                            <div className='w-full h-full flex items-center justify-center text-gray-400'>
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className='p-4'>
                                        {/* Tags */}
                                        {guide.tags && guide.tags.length > 0 && (
                                            <div className='flex flex-wrap gap-1 mb-2'>
                                                {guide.tags.slice(0, 3).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className='text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full'
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Title */}
                                        <h3 className='text-lg font-semibold mb-2 hover:text-red-500 transition-colors line-clamp-2'>
                                            {guide.title}
                                        </h3>

                                        {/* Description */}
                                        {guide.description && (
                                            <p className='text-gray-600 text-sm line-clamp-3 mb-3'>
                                                {guide.description}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className='flex items-center justify-between text-xs text-gray-500'>
                                            <div className='flex items-center gap-2'>
                                                <span className='text-gray-400'>
                                                    {guide.viewCount || 0} views
                                                </span>
                                            </div>
                                            {guide.reactionsCount !== undefined && guide.reactionsCount > 0 && (
                                                <span className='text-gray-400'>
                                                    {guide.reactionsCount} reactions
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className='flex justify-center mt-8'>
                            <Pagination
                                current={currentPage}
                                total={total}
                                pageSize={ITEMS_PER_PAGE}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} guides`}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default GuidesSearch
