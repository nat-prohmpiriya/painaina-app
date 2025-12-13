'use client'

import { LuDot } from "react-icons/lu"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { r2Images } from '@/lib/r2Images'

const PopularDestinationSection = () => {
    const router = useRouter()

    const handleDestinationClick = (destination: string) => {
        router.push(`/guides/search?q=${encodeURIComponent(destination)}`)
    }

    const destinations = [
        {
            name: 'Ayutthaya',
            image: r2Images.ayutthaya,
            places: ['Wat Mahathat', 'Wat Phra Si Sanphet', 'Bang Pa-In Palace']
        },
        {
            name: 'Chiang Mai',
            image: r2Images.chiangmai,
            places: ['Doi Suthep Temple', 'Old City', 'Night Bazaar']
        },
        {
            name: 'Phuket',
            image: r2Images.phuket,
            places: ['Patong Beach', 'Big Buddha', 'Phi Phi Islands']
        },
        {
            name: 'Krabi',
            image: r2Images.krabi,
            places: ['Railay Beach', 'Tiger Cave Temple', 'Emerald Pool']
        }
    ]

    return (
        <div className='py-16 md:py-24 bg-muted/30'>
            <div className='container mx-auto px-4 md:px-6'>
                {/* Section Header */}
                <div className='text-center mb-10 md:mb-12'>
                    <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>
                        Popular Destinations
                    </h2>
                    <p className='text-lg text-muted-foreground'>
                        Explore amazing destinations across Thailand
                    </p>
                </div>

                {/* Destinations Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto'>
                    {destinations.map((dest, index) => (
                        <div
                            key={index}
                            className='group relative overflow-hidden rounded-2xl cursor-pointer h-72 md:h-80 lg:h-96'
                            onClick={() => handleDestinationClick(dest.name)}
                        >
                            <Image
                                src={dest.image}
                                alt={dest.name}
                                fill
                                className='object-cover group-hover:scale-110 transition-transform duration-500'
                            />
                            {/* Gradient Overlay */}
                            <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
                            {/* Content */}
                            <div className='absolute bottom-0 left-0 right-0 p-5 md:p-6'>
                                <h3 className='font-bold text-2xl md:text-3xl text-white mb-3'>
                                    {dest.name}
                                </h3>
                                <div className='flex flex-col gap-1'>
                                    {dest.places.map((place, i) => (
                                        <span key={i} className='text-white/80 text-sm'>
                                            {place}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bangkok Featured Section */}
                <div
                    className='group relative overflow-hidden rounded-2xl cursor-pointer mt-4 md:mt-6 h-72 md:h-80 max-w-7xl mx-auto'
                    onClick={() => handleDestinationClick('Bangkok')}
                >
                    <Image
                        src={r2Images.bangkok3}
                        alt="Bangkok"
                        fill
                        className='object-cover group-hover:scale-105 transition-transform duration-500'
                    />
                    {/* Gradient Overlay */}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />
                    {/* Content */}
                    <div className='absolute bottom-0 left-0 right-0 p-6 md:p-8'>
                        <h3 className='font-bold text-3xl md:text-4xl text-white mb-3'>
                            Bangkok
                        </h3>
                        <p className='flex flex-wrap items-center text-white/80 text-sm md:text-base gap-2'>
                            <span>Grand Palace</span>
                            <LuDot className='hidden sm:block' />
                            <span>Wat Pho Temple</span>
                            <LuDot className='hidden sm:block' />
                            <span>Chatuchak Market</span>
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <div className='flex justify-center mt-10 md:mt-12'>
                    <Link href="/guides">
                        <Button
                            size='lg'
                            variant='outline'
                            className='h-14 px-8 text-lg font-semibold rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                        >
                            View All Destinations
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PopularDestinationSection
