'use client'

import { useState, useCallback, useEffect } from "react"
import { LuPlus, LuMapPin, LuPencil, LuSearch } from "react-icons/lu"
import { usePainainaApi } from "@/services/api-client"
import { placeService, unsplashService } from "@/services"
import { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useCreateTrip } from "@/hooks/useTripQueries"
import type { CreateTripRequest, PlaceOption } from "@/interfaces"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Combobox } from "@/components/ui/combobox"

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

interface CreateTripModalProps {
    onSuccess?: () => void
}

const CreateTripModal = ({ onSuccess }: CreateTripModalProps) => {
    const api = usePainainaApi()
    const createTripMutation = useCreateTrip()
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    })
    const [formErrors, setFormErrors] = useState({
        title: '',
        destination: '',
        dateRange: ''
    })
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7)
    })
    const [selectedPlace, setSelectedPlace] = useState<PlaceOption['place'] | null>(null)
    const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([])
    const [searchText, setSearchText] = useState("")
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
    const { showSuccess, showError } = useToastMessage()

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
            const results = response.predictions || []

            console.log('🔍 API response:', response)
            console.log('🔍 Predictions:', results)

            if (results && results.length > 0) {
                // For now, show all results (cities from in-memory service already filtered)
                const filteredResults = results

                const options: PlaceOption[] = filteredResults
                    .filter((result: any) => result.placeId) // Only include results with valid placeId
                    .map((result: any) => {
                        const cityName = result.name || result.structuredFormatting?.mainText || result.description?.split(',')[0] || ''
                        const country = result.structuredFormatting?.secondaryText || result.description?.split(',').pop()?.trim() || ''
                        const placeTypeLabel = getPlaceTypeLabel(result.types || [])

                        return {
                            value: result.placeId,
                            label: (
                                <div className="flex items-center justify-between py-1">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{cityName}</span>
                                        <span className="text-sm text-gray-500">{country}</span>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        {placeTypeLabel}
                                    </span>
                                </div>
                            ),
                            place: {
                                placeId: result.placeId,
                                name: cityName,
                                formattedAddress: result.formattedAddress || result.description,
                                coordinates: result.location || { lat: 0, lng: 0 },
                                types: result.types || [],
                                photos: [],
                                source: result.source || 'google'
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

    const handlePlaceSelect = async (value: string) => {
        const option = placeOptions.find(opt => opt.value === value)
        if (!option) return

        try {
            let placeData = option.place
            debugger
            // If source is Google (no coordinates), fetch place details
            if (option.place.source === 'google') {
                debugger
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
        } catch (error) {
            console.error('Error getting place photo:', error)
            // Fallback to original place data without cover photo
            setSelectedPlace({
                ...option.place,
                coverPhoto: '/default-trip-cover.jpg'
            })
            setSearchText(option.place.name)
        }
    }

    const validateForm = () => {
        const errors = {
            title: '',
            destination: '',
            dateRange: ''
        }

        if (!formData.title || formData.title.length < 3) {
            errors.title = 'Title must be at least 3 characters'
        }

        if (!selectedPlace) {
            errors.destination = 'Please select a destination'
        }

        if (!dateRange?.from || !dateRange?.to) {
            errors.dateRange = 'Please select trip dates'
        }

        setFormErrors(errors)
        return !errors.title && !errors.destination && !errors.dateRange
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            return
        }

        if (!selectedPlace || !dateRange?.from || !dateRange?.to) {
            return
        }

        try {
            // Separate coverPhoto from destination object
            const { coverPhoto, ...destinationData } = selectedPlace

            // Extract country from formatted address (e.g., "Tokyo, Japan" -> "Japan")
            const addressParts = destinationData.formattedAddress?.split(',') || []
            const country = addressParts[addressParts.length - 1]?.trim() || destinationData.name

            const createData: CreateTripRequest = {
                title: formData.title,
                description: formData.description,
                destination: {
                    name: destinationData.name,
                    country: country,
                    address: destinationData.formattedAddress,
                    coordinates: destinationData.coordinates,
                    placeId: destinationData.placeId
                },
                startDate: dateRange.from.toLocaleDateString('en-CA'), // "YYYY-MM-DD" format
                endDate: dateRange.to.toLocaleDateString('en-CA'),     // "YYYY-MM-DD" format
                coverPhoto: coverPhoto,

                // Default values
                type: "trip",
                level: "Easy",
                tags: [],
                status: "draft"
            }

            await createTripMutation.mutateAsync(createData)

            showSuccess('Trip created successfully!')

            // Reset form and close modal
            setFormData({ title: '', description: '' })
            setFormErrors({ title: '', destination: '', dateRange: '' })
            setSelectedPlace(null)
            setDateRange({
                from: new Date(),
                to: addDays(new Date(), 7)
            })
            setSearchText("")
            setPlaceOptions([])
            setIsOpen(false)

            onSuccess?.()
        } catch (error) {
            showError('Failed to create trip')
            console.error('Create trip error:', error)
        }
    }

    const openModal = () => {
        setIsOpen(true)
        setFormData({ title: '', description: '' })
        setFormErrors({ title: '', destination: '', dateRange: '' })
        setSelectedPlace(null)
        setSearchText("")
        setPlaceOptions([])
        setDateRange({
            from: new Date(),
            to: addDays(new Date(), 7)
        })
    }

    return (
        <>
            <Button
                className="rounded-full font-semibold"
                variant="destructive"
                onClick={openModal}
            >
                <LuPlus className="text-lg" />
                Create New Trip
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Trip</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-6">
                        {/* Destination Search */}
                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Where are you going? <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    value={searchText}
                                    onChange={(e) => handlePlaceSearch(e.target.value)}
                                    placeholder="Search for a destination..."
                                    className="pl-10"
                                />
                                <LuMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                            </div>
                            {placeOptions.length > 0 && (
                                <div className="border rounded-lg max-h-60 overflow-y-auto">
                                    {placeOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                            onClick={() => handlePlaceSelect(option.value)}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {formErrors.destination && (
                                <p className="text-sm text-red-500">{formErrors.destination}</p>
                            )}

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
                                            <LuMapPin className="text-blue-600" />
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

                        {/* Trip Title */}
                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Trip Title <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Give your trip a name"
                                    className="pl-10"
                                />
                                <LuPencil className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                            </div>
                            {formErrors.title && (
                                <p className="text-sm text-red-500">{formErrors.title}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Description (Optional)</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Tell us about your trip..."
                                rows={4}
                            />
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Trip Dates <span className="text-red-500">*</span>
                            </Label>
                            <DateRangePicker
                                date={dateRange}
                                onDateChange={(range) => setDateRange(range)}
                                className="w-full"
                            />
                            {formErrors.dateRange && (
                                <p className="text-sm text-red-500">{formErrors.dateRange}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-8">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsOpen(false)
                                setFormData({ title: '', description: '' })
                                setFormErrors({ title: '', destination: '', dateRange: '' })
                                setSelectedPlace(null)
                                setSearchText("")
                                setPlaceOptions([])
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createTripMutation.isPending}
                        >
                            {createTripMutation.isPending ? 'Creating...' : 'Create Trip'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default CreateTripModal
