'use client'

import FooterSection from '@/components/home/FooterSection'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LuMapPin, LuUsers, LuSparkles, LuCalendarDays, LuBookOpen, LuDownload } from 'react-icons/lu'

const HowItWorksPage = () => {
    const steps = [
        {
            icon: <LuBookOpen className='text-4xl text-red-500' />,
            title: 'Discover Travel Guides',
            description: 'Browse our collection of travel guides for destinations across Thailand. Get inspired by curated itineraries, local tips, and must-visit places.',
        },
        {
            icon: <LuCalendarDays className='text-4xl text-red-500' />,
            title: 'Create Your Trip',
            description: 'Start a new trip by selecting your destination and travel dates. Add places from guides or search for specific locations to build your perfect itinerary.',
        },
        {
            icon: <LuMapPin className='text-4xl text-red-500' />,
            title: 'Plan Your Itinerary',
            description: 'Organize your trip day by day. Add places, set times, add notes, and see everything on an interactive map. Drag and drop to rearrange your schedule.',
        },
        {
            icon: <LuUsers className='text-4xl text-red-500' />,
            title: 'Collaborate with Friends',
            description: 'Invite friends and family to plan together. Everyone can add places, leave comments, and see updates in real-time.',
        },
        {
            icon: <LuSparkles className='text-4xl text-red-500' />,
            title: 'AI-Powered Suggestions',
            description: 'Let our AI help you plan. Get personalized recommendations for places to visit based on your interests and travel style.',
        },
        {
            icon: <LuDownload className='text-4xl text-red-500' />,
            title: 'Access Offline',
            description: 'Download your trip for offline access. View your itinerary, maps, and saved places even without internet connection.',
        },
    ]

    const features = [
        {
            title: 'Interactive Map View',
            description: 'See all your places on a map and optimize your route',
        },
        {
            title: 'Budget Tracking',
            description: 'Set a budget and track expenses for your trip',
        },
        {
            title: 'Packing Checklists',
            description: 'Create custom packing lists so you never forget essentials',
        },
        {
            title: 'Reservation Management',
            description: 'Keep all your booking confirmations in one place',
        },
        {
            title: 'Photo Gallery',
            description: 'Upload and organize photos for each day of your trip',
        },
        {
            title: 'Multi-language Support',
            description: 'Use the app in Thai or English',
        },
    ]

    return (
        <>
            <div className='min-h-screen'>
                {/* Hero Section */}
                <div className='bg-gradient-to-br from-red-50 to-red-100 py-16 md:py-24'>
                    <div className='container mx-auto px-4 text-center'>
                        <h1 className='text-3xl md:text-5xl font-bold mb-6'>
                            How PaiNaiNa Works
                        </h1>
                        <p className='text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8'>
                            Plan your perfect trip in minutes. From discovering destinations to
                            collaborating with friends, we make travel planning easy and fun.
                        </p>
                        <Link href='/guides'>
                            <Button
                                variant="destructive"
                                size='lg'
                                className='font-semibold h-[50px] px-8'
                            >
                                Start Planning
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Steps Section */}
                <div className='container mx-auto px-4 py-16'>
                    <h2 className='text-2xl md:text-3xl font-bold text-center mb-12'>
                        6 Simple Steps to Plan Your Trip
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow'
                            >
                                <div className='flex items-center gap-4 mb-4'>
                                    <div className='w-12 h-12 bg-red-50 rounded-full flex items-center justify-center'>
                                        {step.icon}
                                    </div>
                                    <span className='text-3xl font-bold text-gray-200'>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className='text-lg font-semibold mb-2'>{step.title}</h3>
                                <p className='text-gray-600'>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Section */}
                <div className='bg-gray-50 py-16'>
                    <div className='container mx-auto px-4'>
                        <h2 className='text-2xl md:text-3xl font-bold text-center mb-4'>
                            More Features
                        </h2>
                        <p className='text-gray-600 text-center mb-12 max-w-2xl mx-auto'>
                            Everything you need to plan, organize, and enjoy your travels
                        </p>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto'>
                            {features.map((feature, index) => (
                                <div key={index} className='flex items-start gap-3'>
                                    <div className='w-2 h-2 bg-red-500 rounded-full mt-2' />
                                    <div>
                                        <h3 className='font-semibold'>{feature.title}</h3>
                                        <p className='text-gray-600 text-sm'>{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className='container mx-auto px-4 py-16 text-center'>
                    <h2 className='text-2xl md:text-3xl font-bold mb-4'>
                        Ready to Start Planning?
                    </h2>
                    <p className='text-gray-600 mb-8 max-w-xl mx-auto'>
                        Join thousands of travelers who use PaiNaiNa to plan their perfect trips.
                        It's free to get started!
                    </p>
                    <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                        <Link href='/guides'>
                            <Button
                                variant="destructive"
                                size='lg'
                                className='font-semibold w-full sm:w-auto h-[50px] px-8'
                            >
                                Explore Guides
                            </Button>
                        </Link>
                        <Link href='/trips'>
                            <Button
                                variant="outline"
                                size='lg'
                                className='font-semibold w-full sm:w-auto h-[50px] px-8'
                            >
                                Create a Trip
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <FooterSection />
        </>
    )
}

export default HowItWorksPage
