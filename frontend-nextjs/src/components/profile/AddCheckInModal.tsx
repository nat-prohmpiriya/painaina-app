'use client'

import { useState, useMemo } from "react"
import { LuPlus, LuMapPin, LuCalendar, LuSearch, LuCheck } from "react-icons/lu"
import { format } from "date-fns"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useCreateCheckIn } from "@/hooks/useCheckInQueries"
import { countries, cities, getCitiesByCountry, type Country, type City } from "@/data/locations"
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
import { DateInput } from "@/components/ui/date-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'

interface AddCheckInModalProps {
    onSuccess?: () => void
}

const AddCheckInModal = ({ onSuccess }: AddCheckInModalProps) => {
    const t = useTranslations('profile.checkIn')
    const createCheckInMutation = useCreateCheckIn()
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<'country' | 'city' | 'details'>('country')
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
    const [selectedCity, setSelectedCity] = useState<City | null>(null)
    const [visitedDate, setVisitedDate] = useState<Date>(new Date())
    const [note, setNote] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const { showSuccess, showError } = useToastMessage()

    // Filter cities based on selected country and search query
    const filteredCities = useMemo(() => {
        if (!selectedCountry) return []
        const countryCities = getCitiesByCountry(selectedCountry.code)
        if (!searchQuery) return countryCities
        const query = searchQuery.toLowerCase()
        return countryCities.filter(
            city => city.name.toLowerCase().includes(query) || city.nameLocal.includes(query)
        )
    }, [selectedCountry, searchQuery])

    // Filter countries based on search query
    const filteredCountries = useMemo(() => {
        if (!searchQuery) return countries
        const query = searchQuery.toLowerCase()
        return countries.filter(
            country => country.name.toLowerCase().includes(query) || country.nameLocal.includes(query)
        )
    }, [searchQuery])

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country)
        setSearchQuery('')
        setStep('city')
    }

    const handleCitySelect = (city: City) => {
        setSelectedCity(city)
        setStep('details')
    }

    const handleBack = () => {
        if (step === 'city') {
            setStep('country')
            setSelectedCountry(null)
            setSearchQuery('')
        } else if (step === 'details') {
            setStep('city')
            setSelectedCity(null)
        }
    }

    const handleSubmit = async () => {
        if (!selectedCountry || !selectedCity) return

        try {
            await createCheckInMutation.mutateAsync({
                countryCode: selectedCountry.code,
                country: selectedCountry.name,
                countryFlag: selectedCountry.flag,
                regionId: selectedCity.regionId,
                region: selectedCountry.regions.find(r => r.id === selectedCity.regionId)?.name,
                cityId: selectedCity.id,
                city: selectedCity.name,
                latitude: selectedCity.latitude,
                longitude: selectedCity.longitude,
                visitedAt: format(visitedDate, 'yyyy-MM-dd'),
                note: note || undefined,
            })

            showSuccess(t('addSuccess'))
            handleClose()
            onSuccess?.()
        } catch (error: any) {
            showError(error?.message || t('addError'))
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setStep('country')
        setSelectedCountry(null)
        setSelectedCity(null)
        setVisitedDate(new Date())
        setNote('')
        setSearchQuery('')
    }

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

            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LuMapPin className="w-5 h-5 text-primary" />
                            {step === 'country' && t('modal.selectCountry')}
                            {step === 'city' && t('modal.selectCity')}
                            {step === 'details' && t('modal.addDetails')}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Step: Select Country */}
                    {step === 'country' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('modal.searchCountry')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <ScrollArea className="h-[300px]">
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredCountries.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => handleCountrySelect(country)}
                                            className={cn(
                                                "flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors text-left",
                                                selectedCountry?.code === country.code && "border-primary bg-accent"
                                            )}
                                        >
                                            <span className="text-2xl">{country.flag}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{country.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{country.nameLocal}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Step: Select City */}
                    {step === 'city' && selectedCountry && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                <span className="text-xl">{selectedCountry.flag}</span>
                                <span className="font-medium">{selectedCountry.name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBack}
                                    className="ml-auto text-xs"
                                >
                                    {t('modal.change')}
                                </Button>
                            </div>
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('modal.searchCity')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <ScrollArea className="h-[250px]">
                                <div className="space-y-1">
                                    {filteredCities.map((city) => (
                                        <button
                                            key={city.id}
                                            onClick={() => handleCitySelect(city)}
                                            className={cn(
                                                "flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left",
                                                selectedCity?.id === city.id && "bg-accent"
                                            )}
                                        >
                                            <LuMapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium">{city.name}</div>
                                                <div className="text-xs text-muted-foreground">{city.nameLocal}</div>
                                            </div>
                                            {city.regionId && (
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                    {selectedCountry.regions.find(r => r.id === city.regionId)?.name}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    {filteredCities.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            {t('modal.noResults')}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Step: Add Details */}
                    {step === 'details' && selectedCountry && selectedCity && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <span className="text-xl">{selectedCountry.flag}</span>
                                <div>
                                    <div className="font-medium">{selectedCity.name}</div>
                                    <div className="text-xs text-muted-foreground">{selectedCountry.name}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBack}
                                    className="ml-auto text-xs"
                                >
                                    {t('modal.change')}
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <LuCalendar className="w-4 h-4" />
                                    {t('modal.visitedDate')}
                                </Label>
                                <DateInput
                                    value={visitedDate}
                                    onChange={setVisitedDate}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('modal.note')}</Label>
                                <Textarea
                                    placeholder={t('modal.notePlaceholder')}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {step !== 'country' && (
                            <Button variant="outline" onClick={handleBack}>
                                {t('modal.back')}
                            </Button>
                        )}
                        {step === 'details' && (
                            <Button
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
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default AddCheckInModal
