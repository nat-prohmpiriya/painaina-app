'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { LuListTodo, LuMapPin, LuStickyNote, LuChefHat, LuBed, LuCamera, LuShoppingBag, LuPartyPopper, LuCar, LuBuilding2, LuFuel } from "react-icons/lu";
import SmallPlaceCard from "./SmallPlaceCard";
import { useTripContext } from '@/contexts/TripContext'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { usePainainaApi, placeService } from '@/services'

interface CreateEntryProps {
    dayId: string
}

interface PlaceOption {
    value: string
    label: React.ReactNode
    place: {
        placeId: string
        name: string
        formattedAddress: string
        coordinates: { lat: number; lng: number }
        types: string[]
        photos?: string[]
    }
}

const CreateEntry = ({ dayId }: CreateEntryProps) => {
    const { addEntry, itineraries } = useTripContext()
    const [searchText, setSearchText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([])
    const [selectedPlaceTypes, setSelectedPlaceTypes] = useState<string[]>([])
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Initialize API client to set auth token
    usePainainaApi()
    const placeTypes = [
        { value: 'restaurant', label: 'Restaurants', icon: <LuChefHat className="mr-1" /> },
        { value: 'lodging', label: 'Hotels & Lodging', icon: <LuBed className="mr-1" /> },
        { value: 'tourist_attraction', label: 'Tourist Attractions', icon: <LuCamera className="mr-1" /> },
        { value: 'shopping_mall', label: 'Shopping', icon: <LuShoppingBag className="mr-1" /> },
        { value: 'amusement_park', label: 'Entertainment', icon: <LuPartyPopper className="mr-1" /> },
        { value: 'transit_station', label: 'Transportation', icon: <LuCar className="mr-1" /> },
        { value: 'hospital', label: 'Healthcare', icon: <LuBuilding2 className="mr-1" /> },
        { value: 'gas_station', label: 'Gas Stations', icon: <LuFuel className="mr-1" /> }
    ]

    const getNextOrder = () => {
        const day = itineraries?.find(d => d.id === dayId)
        return day?.entries?.length || 0
    }

    const handleCreateNote = async () => {
        const title = searchText.trim() || 'New Note'

        setIsCreating(true)
        try {
            await addEntry(dayId, {
                type: 'note',
                title: title,
                order: getNextOrder()
            })
            setSearchText('')
        } catch (error) {
            console.error('Error creating note:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleCreateTodoList = async () => {
        const title = searchText.trim() || 'New Todo List'

        setIsCreating(true)
        try {
            await addEntry(dayId, {
                type: 'todos',
                title: title,
                order: getNextOrder()
            })
            setSearchText('')
        } catch (error) {
            console.error('Error creating todo list:', error)
        } finally {
            setIsCreating(false)
        }
    }

    // Cleanup timeout on component unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    const searchPlaces = useCallback(async (value: string) => {
        if (!value.trim()) {
            setPlaceOptions([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const predictions = await placeService.autocomplete(value)
            console.log('Autocomplete predictions:', predictions)

            if (predictions && predictions.length > 0) {
                const options: PlaceOption[] = predictions.map((prediction: any) => {
                    const mainText = prediction.structuredFormatting?.mainText || prediction.description || ''
                    const secondaryText = prediction.structuredFormatting?.secondaryText || ''

                    const displayText = secondaryText
                        ? `${mainText}, ${secondaryText}`
                        : mainText

                    return {
                        value: displayText,
                        label: (
                            <div className="flex flex-col">
                                <span className="font-medium">{mainText}</span>
                                {secondaryText && <span className="text-sm text-gray-500">{secondaryText}</span>}
                            </div>
                        ),
                        place: {
                            placeId: prediction.placeId,
                            name: mainText,
                            formattedAddress: prediction.description,
                            coordinates: { lat: 0, lng: 0 },
                            types: prediction.types || [],
                            photos: []
                        }
                    }
                })
                console.log('Mapped options:', options)
                setPlaceOptions(options)
            } else {
                console.log('No predictions found')
                setPlaceOptions([])
            }
        } catch (error) {
            console.error('Error searching places:', error)
            setPlaceOptions([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handlePlaceSearch = useCallback((value: string) => {
        setSearchText(value)

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchPlaces(value)
        }, 300)
    }, [searchPlaces])

    const handlePlaceTypeChange = (types: string[]) => {
        setSelectedPlaceTypes(types)
        // Re-search if there's already search text
        if (searchText.trim()) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
            searchTimeoutRef.current = setTimeout(() => {
                searchPlaces(searchText)
            }, 300)
        }
    }

    const handlePlaceSelect = async (value: string, option: PlaceOption) => {
        setIsCreating(true)
        try {
            // Get full place details including coordinates, photos, and additional info
            const placeDetails = await placeService.getPlace(option.place.placeId)

            const lat = placeDetails?.geometry?.location?.lat || 0
            const lng = placeDetails?.geometry?.location?.lng || 0

            const place = {
                placeId: option.place.placeId,
                name: option.place.name,
                photoReference: placeDetails?.photos?.[0]?.photoReference || '',
                photoPlace: [],
                types: placeDetails?.types || option.place.types,
                location: {
                    type: 'Point',
                    coordinates: [lng, lat],
                    latitude: lat,
                    longitude: lng
                }
            }

            await addEntry(dayId, {
                type: 'place',
                title: option.place.name,
                place: place,
                order: getNextOrder()
            })

            setSearchText('')
            setPlaceOptions([])
        } catch (error) {
            console.error('Error creating place entry:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchText.trim()) {
            e.preventDefault()
            // ถ้ามี place options ให้เลือก option แรก
            if (placeOptions.length > 0) {
                const firstOption = placeOptions[0]
                handlePlaceSelect(firstOption.value, firstOption)
            }
            // ถ้าไม่มี place options จะไม่ทำอะไร (ไม่สร้าง note)
        }
    }

    const listPlaceSuggestions = [
        { value: 'Restaurant' },
        { value: 'Hotel' },
        { value: 'Tourist Attraction' },
        { value: 'Museum' },
        { value: 'Park' },
        { value: 'Shopping Mall' },
    ];
    return (
        <div className="w-full p-2">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-3 md:hidden">
                {/* Note: For simplicity, using simple text instead of multiselect on mobile */}
                <div className="text-sm text-gray-600">
                    {selectedPlaceTypes.length > 0
                        ? `Filtering: ${placeTypes.filter(t => selectedPlaceTypes.includes(t.value)).map(t => t.label).join(', ')}`
                        : 'All place types'}
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            value={searchText}
                            onChange={(e) => {
                                handlePlaceSearch(e.target.value)
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search for places (e.g., restaur..."
                            className="pl-10"
                            disabled={isCreating}
                        />
                        <LuMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
                        {placeOptions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                                {placeOptions.map((option) => (
                                    <div
                                        key={option.place.placeId}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                        onClick={() => handlePlaceSelect(option.value, option)}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleCreateTodoList}
                                    disabled={isCreating}
                                    className="h-10 w-10 p-0 rounded-full"
                                >
                                    <LuListTodo className="text-xl font-bold" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Create Todo List</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleCreateNote}
                                    disabled={isCreating}
                                    className="h-10 w-10 p-0 rounded-full"
                                >
                                    <LuStickyNote className="text-xl font-bold" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Create Note</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className='hidden md:grid grid-cols-17 gap-4 overflow-visible'>
                <div className="col-span-2"></div>
                <div className="col-span-12 overflow-visible">
                    <div className="mb-2">
                        <div className="text-sm text-gray-600">
                            {selectedPlaceTypes.length > 0
                                ? `Filtering: ${placeTypes.filter(t => selectedPlaceTypes.includes(t.value)).map(t => t.label).join(', ')}`
                                : 'All place types'}
                        </div>
                    </div>
                    <div className="w-full relative">
                        <Input
                            value={searchText}
                            onChange={(e) => {
                                handlePlaceSearch(e.target.value)
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedPlaceTypes.length > 0
                                ? `Search ${placeTypes.filter(t => selectedPlaceTypes.includes(t.value)).map(t => t.label).join(', ')}`
                                : "Search for places (e.g., restaurants, hotels, attractions)"
                            }
                            className="pl-10"
                            disabled={isCreating}
                        />
                        <LuMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
                        {placeOptions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                                {placeOptions.map((option) => (
                                    <div
                                        key={option.place.placeId}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                        onClick={() => handlePlaceSelect(option.value, option)}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="col-span-3 flex gap-2 pt-7 items-start">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleCreateTodoList}
                                    disabled={isCreating}
                                    className="h-10 w-10 p-0 rounded-full"
                                >
                                    <LuListTodo className="text-xl font-bold" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Create Todo List</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleCreateNote}
                                    disabled={isCreating}
                                    className="h-10 w-10 p-0 rounded-full"
                                >
                                    <LuStickyNote className="text-xl font-bold" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Create Note</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            {/* TODO: SmallPlaceCard - temporarily disabled
            <div className="hidden md:grid grid-cols-17">
                <div className="col-span-2"></div>
                <div className="col-span-14 relative">
                    <div className="pt-2 px-2 flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {
                            listPlaceSuggestions.map((place) => (
                                <SmallPlaceCard key={place.value} />
                            ))
                        }
                    </div>
                </div>
            </div>
            */}
        </div>
    )
}

export default CreateEntry