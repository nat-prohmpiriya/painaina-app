'use client'

import { useState } from 'react'
import { Drawer, FloatButton } from 'antd'
import { LuMap } from 'react-icons/lu'
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
                    icon={<LuMap size={24} />}
                    type="primary"
                    className="lg:hidden"
                    onClick={() => setDrawerOpen(true)}
                    tooltip={t('map.openMap')}
                    style={{
                        right: 24,
                        bottom: 88  // Adjusted to avoid BottomNavigation
                    }}
                />

                {/* Map Drawer - 95% height */}
                <Drawer
                    title={t('map.tripMap')}
                    placement="bottom"
                    height="95%"
                    onClose={() => setDrawerOpen(false)}
                    open={drawerOpen}
                    styles={{
                        body: { padding: 0 }
                    }}
                >
                    <div className="h-full">
                        <GoogleMap itineraries={guide.itineraries} />
                    </div>
                </Drawer>
            </div>
        </>
    )
}

export default GuideViewClientWrapper
