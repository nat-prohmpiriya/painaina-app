'use client'

import { LuSearch, LuCalendarPlus, LuPlane } from 'react-icons/lu'

const HowItWorksSection = () => {
    const steps = [
        {
            icon: <LuSearch className='w-8 h-8' />,
            step: '01',
            title: 'Discover',
            description: 'Search thousands of places and travel guides. Find inspiration for your next adventure.'
        },
        {
            icon: <LuCalendarPlus className='w-8 h-8' />,
            step: '02',
            title: 'Plan',
            description: 'Create your itinerary with drag-and-drop ease. Add places, set times, and organize your days.'
        },
        {
            icon: <LuPlane className='w-8 h-8' />,
            step: '03',
            title: 'Travel',
            description: 'Access your trip offline, navigate with maps, and enjoy your perfectly planned journey.'
        }
    ]

    return (
        <div className='py-16 md:py-24'>
            <div className='container mx-auto px-4 md:px-6'>
                {/* Section Header */}
                <div className='text-center max-w-3xl mx-auto mb-12 md:mb-16'>
                    <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>
                        How It Works
                    </h2>
                    <p className='text-lg text-muted-foreground'>
                        Plan your perfect trip in three simple steps
                    </p>
                </div>

                {/* Steps */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto'>
                    {steps.map((step, index) => (
                        <div key={index} className='relative'>
                            {/* Connector Line (hidden on mobile and last item) */}
                            {index < steps.length - 1 && (
                                <div className='hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent' />
                            )}

                            <div className='flex flex-col items-center text-center'>
                                {/* Icon Circle */}
                                <div className='relative mb-6'>
                                    <div className='w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                                        {step.icon}
                                    </div>
                                    {/* Step Number */}
                                    <div className='absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center'>
                                        {step.step}
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className='text-xl md:text-2xl font-bold mb-3'>
                                    {step.title}
                                </h3>
                                <p className='text-muted-foreground'>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default HowItWorksSection
