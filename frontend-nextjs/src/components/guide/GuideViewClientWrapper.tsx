'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { FloatButton } from '@/components/ui/float-button'
import { Map } from 'lucide-react'
import GuideDetail from '@/components/guide/GuideDetail'
import GoogleMap from '@/components/trip/TripMap/GoogleMap'
import { useTranslations } from 'next-intl'
import type { TripDetailResponse } from '@/interfaces/trip.interface'

interface GuideViewClientWrapperProps {
    guide: TripDetailResponse
}

const GuideViewClientWrapper = ({ guide }: GuideViewClientWrapperProps) => {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const t = useTranslations('guideDetail')

    return (
        <>
            {/* Desktop Layout - Hidden on mobile/tablet */}
            <div className="hidden lg:grid lg:grid-cols-9 h-full">
                <div className="col-span-5">
                    <GuideDetail guide={guide} itinerary={guide.itineraries} expenses={guide.expenses} />
                </div>
                <div className="col-span-4">
                    <GoogleMap itineraries={guide.itineraries} />
                </div>
            </div>

            {/* Mobile/Tablet Layout - Hidden on desktop */}
            <div className="lg:hidden h-full">
                <GuideDetail guide={guide} itinerary={guide.itineraries} expenses={guide.expenses} />

                {/* Floating Map Button - Mobile only */}
                <FloatButton
                    icon={<Map size={24} />}
                    onClick={() => setDrawerOpen(true)}
                    tooltip={t('map.openMap')}
                    className="lg:hidden"
                    style={{
                        right: 24,
                        bottom: 88  // Adjusted to avoid BottomNavigation
                    }}
                />

                {/* Map Sheet - 95% height */}
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetContent side="bottom" className="h-[95vh] p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>{t('map.tripMap')}</SheetTitle>
                        </SheetHeader>
                        <div className="h-[calc(100%-4rem)]">
                            <GoogleMap itineraries={guide.itineraries} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}

export default GuideViewClientWrapper
