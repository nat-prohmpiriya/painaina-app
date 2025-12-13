'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Drawer, FloatButton } from 'antd'
import { LuMap } from 'react-icons/lu'
import TripDetail from '@/components/trip/TripDetail'
import TripMap from '@/components/trip/TripMap'
import { TripProvider } from '@/contexts/TripContext'
import { useTranslations } from 'next-intl'

const TripPage = () => {
    const params = useParams()
    const tripId = params.tripsId as string
    const [drawerOpen, setDrawerOpen] = useState(false)
    const t = useTranslations('tripDetail')

    if (!tripId) {
        return <div className="flex items-center justify-center h-full">{t('errors.notFound')}</div>
    }

    return (
        <TripProvider tripId={tripId}>
            {/* Desktop Layout - Hidden on mobile/tablet */}
            <div className="hidden lg:grid lg:grid-cols-5 h-full">
                <div className="col-span-3">
                    <TripDetail />
                </div>
                <div className="col-span-2">
                    <TripMap />
                </div>
            </div>

            {/* Mobile/Tablet Layout - Hidden on desktop */}
            <div className="lg:hidden h-full">
                <TripDetail />

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

                {/* Map Drawer - 85% height */}
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
                        <TripMap />
                    </div>
                </Drawer>
            </div>
        </TripProvider>
    )
}

export default TripPage