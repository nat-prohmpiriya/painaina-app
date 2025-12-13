'use client'

import { useState, useCallback, useEffect } from "react"
import { Button, Modal, Form, Input, AutoComplete, DatePicker } from "antd"
import { LuPlus, LuMapPin, LuPencil } from "react-icons/lu"
import { usePainainaApi } from "@/services/api-client"
import { placeService, unsplashService } from "@/services"
import { DateRange } from "react-day-picker"
import { addDays } from "date-fns"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useCreateTrip } from "@/hooks/useTripQueries"
import dayjs from "dayjs"
import type { CreateTripRequest, PlaceOption } from "@/interfaces"

const { TextArea } = Input

const { RangePicker } = DatePicker

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
    const [form] = Form.useForm()
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

    const handlePlaceSelect = async (value: string, option: PlaceOption) => {
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

    const handleSubmit = async (values: any) => {
        if (!selectedPlace) {
            showError('Please select a destination')
            return
        }

        if (!dateRange?.from || !dateRange?.to) {
            showError('Please select trip dates')
            return
        }

        try {
            // Separate coverPhoto from destination object
            const { coverPhoto, ...destinationData } = selectedPlace

            // Extract country from formatted address (e.g., "Tokyo, Japan" -> "Japan")
            const addressParts = destinationData.formattedAddress?.split(',') || []
            const country = addressParts[addressParts.length - 1]?.trim() || destinationData.name

            const createData: CreateTripRequest = {
                title: values.title,
                description: values.description,
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
            form.resetFields()
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
        form.resetFields()
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
                shape="round"
                color="danger"
                variant="solid"
                onClick={openModal}
            >
                <span className="text-lg font-semibold">+</span>
                <span className="font-semibold">Create New Trip</span>
            </Button>

            <Modal
                title="Create New Trip"
                open={isOpen}
                onCancel={() => {
                    setIsOpen(false)
                    form.resetFields()
                    setSelectedPlace(null)
                    setSearchText("")
                    setPlaceOptions([])
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-6"
                >
                    {/* Destination Search */}
                    <Form.Item
                        label={<span className="font-semibold">Where are you going?</span>}
                        required
                    >
                        <AutoComplete
                            value={searchText}
                            options={placeOptions}
                            onSearch={handlePlaceSearch}
                            onSelect={handlePlaceSelect}

                        >
                            <Input.Search prefix={<LuMapPin className="text-xl text-gray-400" />} size="large" placeholder="Search for a destination..." enterButton allowClear />
                        </AutoComplete>

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
                    </Form.Item>

                    {/* Trip Title */}
                    <Form.Item
                        label={<span className="font-semibold">Trip Title</span>}
                        name="title"
                        rules={[
                            { required: true, message: 'Please enter trip title' },
                            { min: 3, message: 'Title must be at least 3 characters' }
                        ]}
                    >
                        <Input
                            allowClear
                            prefix={<LuPencil className="text-xl text-gray-400" />}
                            placeholder="Give your trip a name"
                            size="large"
                        />
                    </Form.Item>

                    {/* Description */}
                    <Form.Item
                        label={<span className="font-semibold">Description (Optional)</span>}
                        name="description"
                    >
                        <TextArea
                            allowClear
                            rows={4}
                            placeholder="Tell us about your trip..."
                        />
                    </Form.Item>

                    {/* Date Range */}
                    <Form.Item
                        label={<span className="font-semibold">Trip Dates</span>}
                        required
                    >
                        <RangePicker
                            value={dateRange?.from && dateRange?.to
                                ? [dayjs(dateRange.from), dayjs(dateRange.to)]
                                : null
                            }
                            onChange={(dates) => {
                                if (dates && dates[0] && dates[1]) {
                                    setDateRange({
                                        from: dates[0].toDate(),
                                        to: dates[1].toDate()
                                    })
                                } else {
                                    setDateRange(undefined)
                                }
                            }}
                            placeholder={['Start date', 'End date']}
                            size="large"
                            className="w-full"
                            disabledDate={(current) => {
                                return current && current < dayjs().startOf('day')
                            }}
                        />
                    </Form.Item>
                    <div className="flex gap-3 justify-end mt-8">
                        <Button
                            shape="round"
                            onClick={() => {
                                setIsOpen(false)
                                form.resetFields()
                                setSelectedPlace(null)
                                setSearchText("")
                                setPlaceOptions([])
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            shape="round"
                            type="primary"
                            htmlType="submit"
                            loading={createTripMutation.isPending}
                        >
                            Create Trip
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    )
}

export default CreateTripModal
