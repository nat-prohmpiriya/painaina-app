'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LuImage, LuSearch } from 'react-icons/lu'
import { HiOutlinePhotograph } from "react-icons/hi"
import { unsplashService } from '@/services/unsplash.service'

interface UnsplashPhoto {
    id: string
    urls: {
        raw: string
        full: string
        regular: string
        small: string
        thumb: string
    }
    alt_description?: string
    user: {
        name: string
        username: string
    }
}

interface UnsplashGalleryProps {
    onPhotoSelect: (photoUrl: string) => void
    isUpdating: boolean
}

const UnsplashGallery = ({ onPhotoSelect, isUpdating }: UnsplashGalleryProps) => {
    const [searchQuery, setSearchQuery] = useState('travel destination')
    const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

    const searchPhotos = async (query: string) => {
        if (!query.trim()) return

        setLoading(true)
        try {
            const response = await unsplashService.searchPhotos({
                query: query,
                perPage: 12
            })

            setPhotos(response.results || [])
        } catch (error) {
            console.error('Error searching photos:', error)
            setPhotos([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        searchPhotos('travel beautiful destinations')
    }, [])

    const handleSearch = (value: string) => {
        setSearchQuery(value)
        searchPhotos(value)
    }

    const handlePhotoSelect = (photo: UnsplashPhoto) => {
        setSelectedPhoto(photo.id)
        onPhotoSelect(photo.urls.regular)
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <HiOutlinePhotograph className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Search for photos (e.g., 'Tokyo', 'beach sunset', 'mountain')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch(searchQuery)
                        }
                    }}
                    className="pl-10 pr-20"
                    disabled={isUpdating}
                />
                <Button
                    onClick={() => handleSearch(searchQuery)}
                    disabled={isUpdating}
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                    <LuSearch size={16} />
                </Button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                </div>
            )}

            {/* Photo Grid */}
            {!loading && photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className={`relative group cursor-pointer rounded-lg overflow-hidden aspect-video ${selectedPhoto === photo.id ? 'ring-2 ring-blue-500' : ''
                                }`}
                            onClick={() => handlePhotoSelect(photo)}
                        >
                            <img
                                src={photo.urls.small}
                                alt={photo.alt_description || 'Unsplash photo'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                            {/* Select indicator */}
                            {selectedPhoto === photo.id && (
                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                    <div className="bg-blue-500 text-white rounded-full p-2">
                                        <LuImage className="w-6 h-6" />
                                    </div>
                                </div>
                            )}

                            {/* Photo credit */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-white text-xs">by {photo.user.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No results */}
            {!loading && photos.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                    <LuImage className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No photos found for "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try searching for different keywords</p>
                </div>
            )}

            {/* Action buttons */}
            {selectedPhoto && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => setSelectedPhoto(null)}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isUpdating}
                        onClick={() => {
                            const photo = photos.find(p => p.id === selectedPhoto)
                            if (photo) {
                                onPhotoSelect(photo.urls.regular)
                            }
                        }}
                    >
                        {isUpdating ? 'Updating...' : 'Update Cover Photo'}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default UnsplashGallery