'use client'

import TripDetail from '@/components/trip/TripDetail'
import TripMap from '@/components/trip/TripMap'
import { TripProvider } from '@/contexts/TripContext'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Drawer, FloatButton } from 'antd'
import { LuMap } from 'react-icons/lu'
import { useTranslations } from 'next-intl'

const GuideDetailEditorPage = () => {
    const params = useParams()
    const guideId = params?.guideId as string
    const [drawerOpen, setDrawerOpen] = useState(false)
    const t = useTranslations('guideDetail')

    if (!guideId || guideId === 'undefined') {
        return <div className="flex items-center justify-center h-full">{t('errors.notFound')}</div>
    }

    return (
        <TripProvider tripId={guideId}>
            {/* Desktop Layout - Hidden on mobile/tablet */}
            <div className="hidden lg:grid lg:grid-cols-9 h-full">
                <div className='col-span-5'>
                    <TripDetail />
                </div>
                <div className='col-span-4'>
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
                        <TripMap />
                    </div>
                </Drawer>
            </div>
        </TripProvider>
    )
}

export default GuideDetailEditorPage