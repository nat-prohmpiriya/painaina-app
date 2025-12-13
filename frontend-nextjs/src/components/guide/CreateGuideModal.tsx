'use client'

import { useState, useCallback, useEffect } from "react"
import { Button, Modal, Form, Input, AutoComplete } from "antd"
import { LuMapPin, LuPencil } from "react-icons/lu"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { placeService, unsplashService } from '@/services'
import { useCreateTrip } from '@/hooks/useTripQueries'
import type { PlaceOption } from '@/interfaces'

const { TextArea } = Input

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
    const [form] = Form.useForm()
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

    const handlePlaceSelect = async (value: string, option: PlaceOption) => {
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
            form.resetFields()
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

    const openModal = () => {
        setIsOpen(true)
        form.resetFields()
        setSelectedPlace(null)
        setSearchText("")
        setPlaceOptions([])
    }

    return (
        <>
            <Button
                shape="round"
                color="blue"
                variant="solid"
                onClick={openModal}
            >
                <span className="text-lg font-semibold">+</span>
                <span className="font-semibold">Create New Guide</span>
            </Button>

            <Modal
                title="Create New Guide"
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

                    {/* Guide Title */}
                    <Form.Item
                        label={<span className="font-semibold">Guide Title</span>}
                        name="title"
                        rules={[
                            { required: true, message: 'Please enter guide title' },
                            { min: 3, message: 'Title must be at least 3 characters' }
                        ]}
                    >
                        <Input
                            allowClear
                            prefix={<LuPencil className="text-xl text-gray-400" />}
                            placeholder="Give your guide a name"
                            size="large"
                        />
                    </Form.Item>

                    {/* Description - Optional */}
                    <Form.Item
                        label={<span className="font-semibold">Description (Optional)</span>}
                        name="description"
                    >
                        <TextArea
                            allowClear
                            rows={4}
                            placeholder="Tell us about your guide..."
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
                            Create Guide
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    )
}

export default CreateGuideModal