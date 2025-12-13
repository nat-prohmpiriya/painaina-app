'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { LuArrowRight } from 'react-icons/lu'

const CTASection = () => {
    const router = useRouter()

    return (
        <div className='py-16 md:py-24'>
            <div className='container mx-auto px-4 md:px-6'>
                <div className='relative overflow-hidden rounded-3xl'>
                    {/* Background Gradient */}
                    <div className='absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent' />

                    {/* Decorative Elements */}
                    <div className='absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
                    <div className='absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />

                    {/* Content */}
                    <div className='relative px-6 py-16 md:px-12 md:py-24 text-center'>
                        <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4'>
                            Ready to Plan Your Next Adventure?
                        </h2>
                        <p className='text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8'>
                            Join thousands of travelers who use PaiNaiNa to create unforgettable trips.
                            Start planning for free today.
                        </p>

                        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                            <Button
                                size='lg'
                                className='h-14 px-8 text-lg font-semibold rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground'
                                onClick={() => router.push('/trips')}
                            >
                                Get Started Free
                                <LuArrowRight className='w-5 h-5 ml-2' />
                            </Button>
                            <Button
                                size='lg'
                                variant='outline'
                                className='h-14 px-8 text-lg font-semibold rounded-full bg-transparent border-white/30 text-white hover:bg-white/10'
                                onClick={() => router.push('/guides')}
                            >
                                Browse Travel Guides
                            </Button>
                        </div>

                        {/* Trust Badge */}
                        <p className='text-white/60 text-sm mt-8'>
                            No credit card required. Free forever for personal use.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CTASection
