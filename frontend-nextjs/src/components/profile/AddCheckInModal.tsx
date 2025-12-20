'use client'

import { useState, useMemo, useEffect, useRef } from "react"
import { LuPlus, LuMapPin, LuCalendar, LuSearch, LuCheck, LuX, LuChevronDown } from "react-icons/lu"
import { format } from "date-fns"
import dynamic from 'next/dynamic'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useCreateCheckIn, useUserCheckIns } from "@/hooks/useCheckInQueries"
import { useAuth } from '@/hooks/useAuth'
import { countries, cities, searchCities, getCountryByCode, type Country, type City } from "@/data/locations"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DateInput } from "@/components/ui/date-input"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'

// Dynamic import of Map components
const FullscreenMap = dynamic(() => import('react-leaflet').then(async (mod) => {
    const { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } = mod
    const L = await import('leaflet')

    // Create custom marker icon
    const createPinIcon = (color: string = '#ef4444') => {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 30px;
                height: 30px;
                background: ${color};
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
        })
    }

    const redPinIcon = createPinIcon('#ef4444')
    const bluePinIcon = createPinIcon('#3b82f6')

    // Map Controller for flyTo animation
    function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
        const map = useMap()
        useEffect(() => {
            if (center) {
                map.flyTo(center, zoom, { duration: 1.5 })
            }
        }, [center, zoom, map])
        return null
    }

    return function MapComponent({
        checkins,
        selectedLocation,
        onSelectLocation,
        onCancelSelection,
    }: {
        checkins: Array<{ city: string; countryFlag: string; latitude: number; longitude: number }>
        selectedLocation: { city: City; country: Country } | null
        onSelectLocation: () => void
        onCancelSelection: () => void
    }) {
        const defaultCenter: [number, number] = [20.0, 100.0]
        const center = useMemo(() => {
            if (selectedLocation) {
                return [selectedLocation.city.latitude, selectedLocation.city.longitude] as [number, number]
            }
            if (checkins.length === 0) return defaultCenter
            const avgLat = checkins.reduce((sum, c) => sum + c.latitude, 0) / checkins.length
            const avgLng = checkins.reduce((sum, c) => sum + c.longitude, 0) / checkins.length
            return [avgLat, avgLng] as [number, number]
        }, [checkins, selectedLocation])

        return (
            <MapContainer
                center={defaultCenter}
                zoom={5}
                minZoom={2}
                maxZoom={18}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                worldCopyJump={true}
            >
                <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png"
                    attribution='&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap'
                />
                <ZoomControl position="bottomright" />
                <MapController
                    center={selectedLocation ? [selectedLocation.city.latitude, selectedLocation.city.longitude] : null}
                    zoom={10}
                />

                {/* Existing check-ins markers */}
                {checkins.map((checkin, index) => (
                    <Marker
                        key={`checkin-${index}`}
                        position={[checkin.latitude, checkin.longitude]}
                        icon={bluePinIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <span className="text-lg">{checkin.countryFlag}</span>
                                <div className="font-medium">{checkin.city}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Selected location marker */}
                {selectedLocation && (
                    <Marker
                        position={[selectedLocation.city.latitude, selectedLocation.city.longitude]}
                        icon={redPinIcon}
                    >
                        <Popup>
                            <div className="text-center min-w-[150px]">
                                <span className="text-2xl">{selectedLocation.country.flag}</span>
                                <div className="font-bold text-lg">{selectedLocation.city.name}</div>
                                <div className="text-sm text-gray-500">{selectedLocation.country.name}</div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={onCancelSelection}
                                        className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onSelectLocation}
                                        className="flex-1 bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        )
    }
}), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
            <div className="text-gray-500">Loading map...</div>
        </div>
    )
})

interface AddCheckInModalProps {
    onSuccess?: () => void
}

const AddCheckInModal = ({ onSuccess }: AddCheckInModalProps) => {
    const t = useTranslations('profile.checkIn')
    const { user } = useAuth()
    const createCheckInMutation = useCreateCheckIn()
    const { data: checkInData } = useUserCheckIns(user?.id)

    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showResults, setShowResults] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState<{ city: City; country: Country } | null>(null)
    const [showDetailsForm, setShowDetailsForm] = useState(false)
    const [visitedDate, setVisitedDate] = useState<Date>(new Date())
    const [note, setNote] = useState('')
    const { showSuccess, showError } = useToastMessage()
    const searchRef = useRef<HTMLDivElement>(null)

    const stats = checkInData?.stats
    const checkins = checkInData?.checkins || []

    // Prepare markers data for map
    const markers = useMemo(() => {
        return checkins.map(c => ({
            city: c.city,
            countryFlag: c.countryFlag,
            latitude: c.latitude,
            longitude: c.longitude,
        }))
    }, [checkins])

    // Search results
    const searchResults = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return { cities: [], countries: [] }
        const q = searchQuery.toLowerCase()

        // Search cities
        const matchedCities = searchCities(searchQuery).slice(0, 8)

        // Search countries
        const matchedCountries = countries.filter(c =>
            c.name.toLowerCase().includes(q) || c.nameLocal.includes(q)
        ).slice(0, 4)

        return { cities: matchedCities, countries: matchedCountries }
    }, [searchQuery])

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleCitySelect = (city: City) => {
        const country = getCountryByCode(city.countryCode)
        if (country) {
            setSelectedLocation({ city, country })
            setSearchQuery('')
            setShowResults(false)
        }
    }

    const handleCountrySelect = (country: Country) => {
        // Find the first city in this country to center the map
        const firstCity = cities.find(c => c.countryCode === country.code)
        if (firstCity) {
            setSelectedLocation({ city: firstCity, country })
        }
        setSearchQuery('')
        setShowResults(false)
    }

    const handleAddPlace = () => {
        setShowDetailsForm(true)
    }

    const handleSubmit = async () => {
        if (!selectedLocation) return

        const { city, country } = selectedLocation

        try {
            await createCheckInMutation.mutateAsync({
                countryCode: country.code,
                country: country.name,
                countryFlag: country.flag,
                regionId: city.regionId,
                region: country.regions.find(r => r.id === city.regionId)?.name,
                cityId: city.id,
                city: city.name,
                latitude: city.latitude,
                longitude: city.longitude,
                visitedAt: format(visitedDate, 'yyyy-MM-dd'),
                note: note || undefined,
            })

            showSuccess(t('addSuccess'))
            // Reset form but keep map open
            setSelectedLocation(null)
            setShowDetailsForm(false)
            setVisitedDate(new Date())
            setNote('')
            onSuccess?.()
        } catch (error: any) {
            showError(error?.message || t('addError'))
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setSearchQuery('')
        setShowResults(false)
        setSelectedLocation(null)
        setShowDetailsForm(false)
        setVisitedDate(new Date())
        setNote('')
    }

    const hasResults = searchResults.cities.length > 0 || searchResults.countries.length > 0

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                variant="secondary"
                size="sm"
                className="shadow-md rounded-full"
            >
                <LuPlus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{t('addPlaces')}</span>
                <span className="sm:hidden">{t('addPlacesMobile')}</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={() => {}}>
                <DialogContent
                    className="fixed! inset-0! top-0! left-0! translate-x-0! translate-y-0! h-screen! w-screen! max-w-none! p-0! gap-0! rounded-none! border-0!"
                    showCloseButton={false}
                >
                    <DialogTitle className="sr-only">{t('addPlaces')}</DialogTitle>
                    {/* Map Container */}
                    <div className="relative h-full w-full">
                        <FullscreenMap
                            checkins={markers}
                            selectedLocation={selectedLocation}
                            onSelectLocation={handleAddPlace}
                            onCancelSelection={() => setSelectedLocation(null)}
                        />

                        {/* Header Overlay */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-600">
                            {/* Stats Bar (Left) */}
                            <div className="bg-black/75 text-white p-3 rounded-lg shadow-lg flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors">
                                        <span className="text-xl font-bold">{stats?.totalCountries || 0}</span>
                                        <span className="text-xs text-gray-300 uppercase">Countries</span>
                                        <LuChevronDown className="w-3 h-3 text-gray-400" />
                                    </button>
                                    <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors">
                                        <span className="text-xl font-bold">{stats?.totalCities || 0}</span>
                                        <span className="text-xs text-gray-300 uppercase">Cities</span>
                                        <LuChevronDown className="w-3 h-3 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Search Box (Center) */}
                            <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
                                <div className="relative">
                                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        placeholder={t('modal.searchPlaceholder') || "Add somewhere you've been"}
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            setShowResults(true)
                                        }}
                                        onFocus={() => setShowResults(true)}
                                        className="pl-10 pr-4 py-3 bg-white shadow-lg rounded-full border-0 text-base"
                                    />
                                </div>

                                {/* Search Results Dropdown */}
                                {showResults && hasResults && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl max-h-[400px] overflow-y-auto z-700">
                                        {/* Countries */}
                                        {searchResults.countries.length > 0 && (
                                            <div className="p-2">
                                                <div className="text-xs font-medium text-gray-500 px-2 py-1 uppercase">Countries</div>
                                                {searchResults.countries.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        onClick={() => handleCountrySelect(country)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                                                    >
                                                        <span className="text-2xl">{country.flag}</span>
                                                        <div>
                                                            <div className="font-medium">{country.name}</div>
                                                            <div className="text-sm text-gray-500">{country.nameLocal}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Cities */}
                                        {searchResults.cities.length > 0 && (
                                            <div className="p-2 border-t">
                                                <div className="text-xs font-medium text-gray-500 px-2 py-1 uppercase">Cities</div>
                                                {searchResults.cities.map((city) => {
                                                    const country = getCountryByCode(city.countryCode)
                                                    return (
                                                        <button
                                                            key={city.id}
                                                            onClick={() => handleCitySelect(city)}
                                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                                                        >
                                                            <span className="text-2xl">{country?.flag}</span>
                                                            <div className="flex-1">
                                                                <div className="font-medium">{city.name}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    {city.nameLocal} • {country?.name}
                                                                </div>
                                                            </div>
                                                            <LuMapPin className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Close Button (Right) */}
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                            >
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Details Form (Bottom Sheet) */}
                        {showDetailsForm && selectedLocation && (
                            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-600 p-6">
                                <div className="max-w-lg mx-auto">
                                    {/* Close button */}
                                    <button
                                        onClick={() => {
                                            setShowDetailsForm(false)
                                            setSelectedLocation(null)
                                        }}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                    >
                                        <LuX className="w-4 h-4" />
                                    </button>

                                    {/* Location Info */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-3xl">{selectedLocation.country.flag}</span>
                                        <div>
                                            <div className="font-bold text-xl">{selectedLocation.city.name}</div>
                                            <div className="text-gray-500">{selectedLocation.country.name}</div>
                                        </div>
                                    </div>

                                    {/* Date Input */}
                                    <div className="space-y-2 mb-4">
                                        <Label className="flex items-center gap-2">
                                            <LuCalendar className="w-4 h-4" />
                                            {t('modal.visitedDate')}
                                        </Label>
                                        <DateInput
                                            value={visitedDate}
                                            onChange={setVisitedDate}
                                        />
                                    </div>

                                    {/* Note Input */}
                                    <div className="space-y-2 mb-6">
                                        <Label>{t('modal.note')}</Label>
                                        <Textarea
                                            placeholder={t('modal.notePlaceholder')}
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-full"
                                            onClick={() => {
                                                setShowDetailsForm(false)
                                                setSelectedLocation(null)
                                            }}
                                        >
                                            {t('modal.back')}
                                        </Button>
                                        <Button
                                            className="flex-1 rounded-full"
                                            onClick={handleSubmit}
                                            disabled={createCheckInMutation.isPending}
                                        >
                                            {createCheckInMutation.isPending ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    {t('modal.saving')}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <LuCheck className="w-4 h-4" />
                                                    {t('modal.save')}
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default AddCheckInModal
