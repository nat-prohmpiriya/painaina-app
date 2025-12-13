'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { r2Images } from '@/lib/r2Images'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
    LuUsers,
    LuSparkles,
    LuMap,
    LuCalendarDays,
    LuBookmark,
    LuWifi
} from 'react-icons/lu'

const FeaturesSection = () => {
    const t = useTranslations('home.features')
    const router = useRouter()

    const features = [
        {
            icon: <LuBookmark className='w-6 h-6' />,
            img: r2Images.featureAddPlace,
            title: t('list.addPlaces.title'),
            description: t('list.addPlaces.description')
        },
        {
            icon: <LuUsers className='w-6 h-6' />,
            img: r2Images.featureCollaborate,
            title: t('list.collaborate.title'),
            description: t('list.collaborate.description')
        },
        {
            icon: <LuSparkles className='w-6 h-6' />,
            img: r2Images.featureAiGenerate,
            title: t('list.autoGenerate.title'),
            description: t('list.autoGenerate.description')
        },
        {
            icon: <LuMap className='w-6 h-6' />,
            img: r2Images.featureIntraceMap,
            title: t('list.mapView.title'),
            description: t('list.mapView.description')
        },
        {
            icon: <LuCalendarDays className='w-6 h-6' />,
            img: r2Images.featureOneClickBook,
            title: t('list.bookingManagement.title'),
            description: t('list.bookingManagement.description')
        },
        {
            icon: <LuWifi className='w-6 h-6' />,
            img: r2Images.featureOffline,
            title: t('list.offlineAccess.title'),
            description: t('list.offlineAccess.description')
        },
    ]

    const [activeFeature, setActiveFeature] = useState(0)

    return (
        <div className='bg-muted/50 py-16 md:py-24'>
            <div className='container mx-auto px-4 md:px-6'>
                {/* Section Header */}
                <div className='text-center max-w-3xl mx-auto mb-12 md:mb-16'>
                    <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>
                        {t('title')}
                    </h2>
                    <p className='text-lg text-muted-foreground'>
                        Everything you need to plan, organize, and enjoy your travels
                    </p>
                </div>

                {/* Features Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-16'>
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className='group bg-background rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer'
                            onClick={() => setActiveFeature(index)}
                        >
                            {/* Image */}
                            <div className='relative w-full h-48 md:h-56 overflow-hidden'>
                                <Image
                                    src={feature.img}
                                    alt={feature.title}
                                    fill
                                    className='object-cover group-hover:scale-105 transition-transform duration-300'
                                />
                            </div>
                            {/* Content */}
                            <div className='p-5 md:p-6'>
                                <div className='flex items-center gap-3 mb-3'>
                                    <div className='w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center'>
                                        {feature.icon}
                                    </div>
                                    <h3 className='text-lg font-semibold'>{feature.title}</h3>
                                </div>
                                <p className='text-muted-foreground text-sm'>{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interactive Demo Section */}
                <div className='max-w-5xl mx-auto'>
                    <div className='relative rounded-2xl overflow-hidden'>
                        {/* Gradient Background */}
                        <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10' />

                        {/* Content */}
                        <div className='relative p-6 md:p-12'>
                            <div className='text-center mb-8'>
                                <h3 className='text-xl md:text-2xl font-semibold mb-2'>
                                    {features[activeFeature].title}
                                </h3>
                                <p className='text-muted-foreground'>
                                    {features[activeFeature].description}
                                </p>
                            </div>

                            {/* Screenshot */}
                            <div className='relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-border'>
                                <Image
                                    src={features[activeFeature].img}
                                    alt={features[activeFeature].title}
                                    fill
                                    className='object-cover'
                                />
                            </div>

                            {/* Feature Selector */}
                            <div className='flex justify-center gap-2 mt-6'>
                                {features.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveFeature(index)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                                            activeFeature === index
                                                ? 'bg-primary w-8'
                                                : 'bg-border hover:bg-muted-foreground'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className='flex justify-center mt-12'>
                    <Button
                        size='lg'
                        className='h-14 px-8 text-lg font-semibold rounded-full'
                        onClick={() => router.push('/trips')}
                    >
                        {t('cta')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default FeaturesSection
