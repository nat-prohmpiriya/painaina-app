'use client'

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MapPin, Pencil, Search } from "lucide-react"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { placeService, unsplashService } from '@/services'
import { useCreateTrip } from '@/hooks/useTripQueries'
import type { PlaceOption } from '@/interfaces'
import { useForm } from "react-hook-form"

// Convert Google types to human-readable label
const getPlaceTypeLabel = (types: string[]): string => {
    // Priority: locality > administrative_area_level_1 > country
    if (types.includes('locality') || types.includes('postal_town') || types.includes('sublocality')) {
        return 'City'
    }
    if (types.includes('administrative_area_level_1')) {
        return 'Region'
    }
    if (types.includes('country')) {
        return 'Country'
    }
    return 'Place'
}

interface CreateGuideModalProps {
    onSuccess?: () => void
}

const CreateGuideModal = ({ onSuccess }: CreateGuideModalProps) => {
    const createTripMutation = useCreateTrip()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedPlace, setSelectedPlace] = useState<PlaceOption['place'] | null>(null)
    const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([])
    const [searchText, setSearchText] = useState("")
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
    const [showPlacePopover, setShowPlacePopover] = useState(false)
    const { showSuccess, showError } = useToastMessage()
    const { register, handleSubmit: handleFormSubmit, formState: { errors }, reset } = useForm<{
        title: string
        description?: string
    }>()

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
            return
        }

        try {
            const response = await placeService.autocompleteCity(value)
            const predictions = response.predictions || []

            if (predictions && predictions.length > 0) {
                const options: PlaceOption[] = predictions.map((prediction: any) => {
                    const mainText = prediction.structuredFormatting?.mainText || prediction.description || ''
                    const secondaryText = prediction.structuredFormatting?.secondaryText || ''
                    const placeTypeLabel = getPlaceTypeLabel(prediction.types || [])

                    return {
                        value: prediction.placeId,
                        label: (
                            <div className="flex items-center justify-between py-1">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900">{mainText}</span>
                                    <span className="text-sm text-gray-500">{secondaryText}</span>
                                </div>
                                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    {placeTypeLabel}
                                </span>
                            </div>
                        ),
                        place: {
                            placeId: prediction.placeId,
                            name: mainText,
                            formattedAddress: prediction.description,
                            coordinates: prediction.location || { lat: 0, lng: 0 },
                            types: prediction.types || [],
                            photos: [],
                            source: prediction.source || 'google'
                        }
                    }
                })
                setPlaceOptions(options)
            }
        } catch (error) {
            console.error('Error searching places:', error)

            // Show user-friendly error message
            if (error instanceof Error) {
                if (error.message.includes('API key')) {
                    showError('Location search service is unavailable')
                } else if (error.message.includes('OVER_QUERY_LIMIT')) {
                    showError('Too many search requests. Please try again later')
                } else {
                    showError('Unable to search locations. Please try again')
                }
            }

            // Clear options on error
            setPlaceOptions([])
        }
    }, [])

    const handlePlaceSearch = useCallback((value: string) => {
        setSearchText(value)

        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }

        // Set new timeout for debouncing
        const newTimeout = setTimeout(() => {
            searchPlaces(value)
        }, 500) // 500ms delay

        setSearchTimeout(newTimeout)
    }, [searchPlaces, searchTimeout])

    const handlePlaceSelect = async (option: PlaceOption) => {
        try {
            let placeData = option.place

            // If source is Google (no coordinates), fetch place details
            if (option.place.source === 'google') {
                try {
                    const placeDetails = await placeService.getPlace(option.place.placeId)
                    // Update coordinates from place details
                    placeData = {
                        ...placeData,
                        coordinates: placeDetails.location || { lat: 0, lng: 0 },
                        formattedAddress: placeDetails.formattedAddress || placeDetails.formatted_address || placeData.formattedAddress
                    }
                } catch (error) {
                    console.error('Error fetching place details:', error)
                    // Continue with existing data
                }
            }

            // Get 5 cover photos from Unsplash then randomly select one
            const cityPhotos = await unsplashService.searchPhotos({
                query: placeData.name,
                perPage: 5
            })

            // Randomly select one photo from results
            let coverPhoto = '/default-trip-cover.jpg'
            if (cityPhotos.results && cityPhotos.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * cityPhotos.results.length)
                coverPhoto = cityPhotos.results[randomIndex]?.urls?.regular || '/default-trip-cover.jpg'
            }

            const place = {
                ...placeData,
                coverPhoto: coverPhoto
            }

            setSelectedPlace(place)
            setSearchText(place.name)
            setShowPlacePopover(false)
        } catch (error) {
            console.error('Error getting place photo:', error)
            // Fallback to original place data without cover photo
            setSelectedPlace({
                ...option.place,
                coverPhoto: '/default-trip-cover.jpg'
            })
            setSearchText(option.place.name)
            setShowPlacePopover(false)
        }
    }

    const handleSubmit = async (values: any) => {
        if (!selectedPlace) {
            showError('Please select a destination')
            return
        }

        try {
            // Separate coverPhoto from destination object
            const { coverPhoto, ...destinationData } = selectedPlace

            // Extract country from formatted address (e.g., "Tokyo, Japan" -> "Japan")
            const addressParts = destinationData.formattedAddress?.split(',') || []
            const country = addressParts[addressParts.length - 1]?.trim() || destinationData.name

            await createTripMutation.mutateAsync({
                title: values.title,
                description: values.description || '', // Optional description
                destination: {
                    name: destinationData.name,
                    country: country,
                    address: destinationData.formattedAddress,
                    coordinates: destinationData.coordinates,
                    placeId: destinationData.placeId
                },
                startDate: new Date().toLocaleDateString('en-CA'), // "YYYY-MM-DD" format
                endDate: new Date().toLocaleDateString('en-CA'),   // "YYYY-MM-DD" format
                coverPhoto: coverPhoto,

                // Default values for guide
                type: "guide",
                level: "Easy",
                tags: [],
                status: "draft"
            })

            showSuccess('Guide created successfully!')

            // Reset form and close modal
            reset()
            setSelectedPlace(null)
            setSearchText("")
            setPlaceOptions([])
            setIsOpen(false)

            onSuccess?.()
        } catch (error) {
            showError('Failed to create guide')
            console.error('Create guide error:', error)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        reset()
        setSelectedPlace(null)
        setSearchText("")
        setPlaceOptions([])
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full">
                    <span className="text-lg font-semibold mr-1">+</span>
                    <span className="font-semibold">Create New Guide</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Guide</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFormSubmit(handleSubmit)} className="space-y-6 mt-4">
                    {/* Destination Search */}
                    <div className="space-y-2">
                        <label className="font-semibold">
                            Where are you going? <span className="text-red-500">*</span>
                        </label>
                        <Popover open={showPlacePopover} onOpenChange={setShowPlacePopover}>
                            <PopoverTrigger asChild>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search for a destination..."
                                        value={searchText}
                                        onChange={(e) => {
                                            setSearchText(e.target.value)
                                            handlePlaceSearch(e.target.value)
                                            setShowPlacePopover(true)
                                        }}
                                        className="pl-10 h-12"
                                    />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[500px] p-0" align="start">
                                <Command>
                                    <CommandEmpty>No places found.</CommandEmpty>
                                    <CommandGroup>
                                        {placeOptions.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                onSelect={() => handlePlaceSelect(option)}
                                                className="cursor-pointer"
                                            >
                                                {option.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {selectedPlace && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                    {selectedPlace.coverPhoto && selectedPlace.coverPhoto !== '/default-trip-cover.jpg' && (
                                        <img
                                            src={selectedPlace.coverPhoto}
                                            alt={selectedPlace.name}
                                            className="w-16 h-12 rounded-lg object-cover"
                                        />
                                    )}
                                    <div className="flex items-center gap-2 flex-1">
                                        <MapPin className="text-blue-600" />
                                        <div>
                                            <div className="font-medium text-blue-900">
                                                {selectedPlace.name}
                                            </div>
                                            <div className="text-sm text-blue-600">
                                                {selectedPlace.formattedAddress}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Guide Title */}
                    <div className="space-y-2">
                        <label className="font-semibold">
                            Guide Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                {...register("title", {
                                    required: "Please enter guide title",
                                    minLength: {
                                        value: 3,
                                        message: "Title must be at least 3 characters"
                                    }
                                })}
                                placeholder="Give your guide a name"
                                className="pl-10 h-12"
                            />
                        </div>
                        {errors.title && (
                            <p className="text-sm text-red-500">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description - Optional */}
                    <div className="space-y-2">
                        <label className="font-semibold">Description (Optional)</label>
                        <Textarea
                            {...register("description")}
                            rows={4}
                            placeholder="Tell us about your guide..."
                        />
                    </div>

                    <div className="flex gap-3 justify-end mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createTripMutation.isPending}
                            className="rounded-full"
                        >
                            {createTripMutation.isPending ? "Creating..." : "Create Guide"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateGuideModal