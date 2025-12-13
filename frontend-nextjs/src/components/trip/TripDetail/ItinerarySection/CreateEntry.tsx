'use client'

import { AutoComplete, Button, Checkbox, Input, Tooltip, Select } from "antd"
import { LuListTodo, LuMapPin, LuStickyNote, LuChefHat, LuBed, LuCamera, LuShoppingBag, LuPartyPopper, LuCar, LuBuilding2, LuFuel } from "react-icons/lu";
import SmallPlaceCard from "./SmallPlaceCard";
import { useTripContext } from '@/contexts/TripContext'
import { useState, useCallback, useEffect } from 'react'

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
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
    const [selectedPlaceTypes, setSelectedPlaceTypes] = useState<string[]>([])

    // Use placeService instead of Convex
    const { placeService } = require('@/services')
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
            if (searchTimeout) {
                clearTimeout(searchTimeout)
            }
        }
    }, [searchTimeout])

    const searchPlaces = useCallback(async (value: string) => {
        if (!value.trim()) {
            setPlaceOptions([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const searchTypes = selectedPlaceTypes.length > 0
                ? selectedPlaceTypes.join('|')
                : "establishment"

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
    }, [placeService, selectedPlaceTypes])

    const handlePlaceSearch = useCallback((value: string) => {
        setSearchText(value)

        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }

        const newTimeout = setTimeout(() => {
            searchPlaces(value)
        }, 300)

        setSearchTimeout(newTimeout)
    }, [searchPlaces, searchTimeout])

    const handlePlaceTypeChange = (types: string[]) => {
        setSelectedPlaceTypes(types)
        // Re-search if there's already search text
        if (searchText.trim()) {
            if (searchTimeout) {
                clearTimeout(searchTimeout)
            }
            const newTimeout = setTimeout(() => {
                searchPlaces(searchText)
            }, 300)
            setSearchTimeout(newTimeout)
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
                <Select
                    mode="multiple"
                    placeholder="Select place types (all types...)"
                    options={placeTypes.map(type => ({
                        value: type.value,
                        label: (
                            <div className="flex items-center">
                                {type.icon}
                                {type.label}
                            </div>
                        )
                    }))}
                    value={selectedPlaceTypes}
                    onChange={handlePlaceTypeChange}
                    style={{ width: '100%' }}
                    maxTagCount="responsive"
                    size="large"
                    allowClear
                />
                <div className="flex gap-2">
                    <AutoComplete
                        className="flex-1"
                        options={placeOptions}
                        value={searchText}
                        onChange={handlePlaceSearch}
                        onSelect={handlePlaceSelect}
                        onKeyDown={handleKeyDown}
                        allowClear
                        filterOption={false}
                        notFoundContent={isLoading ? "Searching..." : "No places found"}
                    >
                        <Input
                            prefix={<LuMapPin className="text-xl text-gray-400" />}
                            placeholder="Search for places (e.g., restaur..."
                            size="large"
                            disabled={isCreating}
                        />
                    </AutoComplete>
                    <Tooltip title="Create Todo List">
                        <Button
                            size="large"
                            icon={<LuListTodo className="text-xl font-bold" />}
                            shape="circle"
                            color="default"
                            variant="outlined"
                            onClick={handleCreateTodoList}
                            loading={isCreating}
                            disabled={isCreating}
                        />
                    </Tooltip>
                    <Tooltip title="Create Note">
                        <Button
                            size="large"
                            icon={<LuStickyNote className="text-xl font-bold" />}
                            shape="circle"
                            color="default"
                            variant="outlined"
                            onClick={handleCreateNote}
                            loading={isCreating}
                            disabled={isCreating}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className='hidden md:grid grid-cols-17 gap-4'>
                <div className="col-span-2"></div>
                <div className="col-span-12">
                    <div className="mb-2">
                        <Select
                            mode="multiple"
                            placeholder="Select place types (all types if none selected)"
                            options={placeTypes.map(type => ({
                                value: type.value,
                                label: (
                                    <div className="flex items-center">
                                        {type.icon}
                                        {type.label}
                                    </div>
                                )
                            }))}
                            value={selectedPlaceTypes}
                            onChange={handlePlaceTypeChange}
                            style={{ width: '100%', }}
                            maxTagCount="responsive"
                            size="large"
                            allowClear
                        />
                    </div>
                    <AutoComplete
                        className="w-full"
                        options={placeOptions}
                        value={searchText}
                        onChange={handlePlaceSearch}
                        onSelect={handlePlaceSelect}
                        onKeyDown={handleKeyDown}
                        allowClear
                        filterOption={false}
                        notFoundContent={isLoading ? "Searching..." : "No places found"}
                    >
                        <Input
                            prefix={<LuMapPin className="text-xl text-gray-400" />}
                            placeholder={selectedPlaceTypes.length > 0
                                ? `Search ${placeTypes.filter(t => selectedPlaceTypes.includes(t.value)).map(t => t.label).join(', ')}`
                                : "Search for places (e.g., restaurants, hotels, attractions)"
                            }
                            size="large"
                            disabled={isCreating}
                        />
                    </AutoComplete>
                </div>
                <div className="col-span-3 flex gap-2 pt-12">
                    <Tooltip title="Create Todo List">
                        <Button
                            size="large"
                            icon={<LuListTodo className="text-xl font-bold" />}
                            shape="circle"
                            color="default"
                            variant="outlined"
                            className="col-span-1"
                            onClick={handleCreateTodoList}
                            loading={isCreating}
                            disabled={isCreating}
                            title="Create Todo List"
                        />
                    </Tooltip>
                    <Tooltip title="Create Note">
                        <Button
                            size="large"
                            icon={<LuStickyNote className="text-xl font-bold" />}
                            shape="circle"
                            color="default"
                            variant="outlined"
                            className="col-span-1"
                            onClick={handleCreateNote}
                            loading={isCreating}
                            disabled={isCreating}
                            title="Create Note"
                        />
                    </Tooltip>
                </div>
            </div>
            <div className="hidden md:grid grid-cols-17">
                <div className="col-span-2"></div>
                <div className="col-span-14 relative">
                    <div className="py-4 px-2 flex gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {
                            listPlaceSuggestions.map((place) => (
                                <SmallPlaceCard key={place.value} />
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateEntry