'use client'

import Image from 'next/image'
import { r2Images } from '@/lib/r2Images'
import {
    LuMountain, LuBuilding2, LuLeaf,
    LuUtensilsCrossed, LuShoppingBag, LuSparkles, LuWaves,
    LuBike, LuActivity, LuCar,
} from 'react-icons/lu'
import { useRouter } from 'next/navigation'

const InterestsSection = () => {
    const router = useRouter()

    const handleInterestClick = (interest: string) => {
        router.push(`/guides/search?tags=${encodeURIComponent(interest)}`)
    }

    return (
        <div className='container mx-auto'>
            <h2 className='text-3xl font-bold mb-4'>Find your travel style</h2>
            <p className='text-lg text-gray-500 mb-8'>Discover perfect itineraries tailored to your travel preferences</p>
            <div className='grid grid-cols-4 gap-2 mb-2'>
                <div className='col-span-2 relative overflow-hidden rounded-lg cursor-pointer group h-80' onClick={() => handleInterestClick('Adventure')}>
                    <Image src={r2Images.thaiNature} alt="Adventure" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                    <div className='absolute inset-0 bg-black/10 flex flex-col justify-end p-6'>
                        <div className='flex items-center mb-4'>
                            <LuMountain className='text-white text-3xl mr-3' />
                            <span className='text-white text-2xl font-bold'>Adventure</span>
                        </div>
                        <p className='text-white text-sm opacity-90'>Hiking • Rock climbing • Zip-lining • Bungee jumping</p>
                    </div>
                </div>
                <div className='col-span-1 flex flex-col gap-2'>
                    <div className='relative overflow-hidden rounded-lg cursor-pointer group h-[156px]' onClick={() => handleInterestClick('Cultural')}>
                        <Image src={r2Images.temples} alt="Cultural" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                        <div className='absolute inset-0 bg-black/10 flex flex-col justify-end p-4'>
                            <div className='flex items-center mb-2'>
                                <LuBuilding2 className='text-white text-xl mr-2' />
                                <span className='text-white text-lg font-bold'>Cultural</span>
                            </div>
                            <p className='text-white text-xs opacity-90'>Temples • Museums</p>
                        </div>
                    </div>
                    <div className='relative overflow-hidden rounded-lg cursor-pointer group h-[156px]' onClick={() => handleInterestClick('Beach')}>
                        <Image src={r2Images.beaches} alt="Beach" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                        <div className='absolute inset-0 bg-black/10 flex flex-col justify-end p-4'>
                            <div className='flex items-center mb-2'>
                                <LuWaves className='text-white text-xl mr-2' />
                                <span className='text-white text-lg font-bold'>Beach</span>
                            </div>
                            <p className='text-white text-xs opacity-90'>Island hopping • Diving</p>
                        </div>
                    </div>
                </div>
                <div className='col-span-1 flex flex-col gap-2'>
                    <div className='relative overflow-hidden rounded-lg cursor-pointer group h-[156px]' onClick={() => handleInterestClick('Food Tour')}>
                        <Image src={r2Images.thaifood} alt="Food Tour" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                        <div className='absolute inset-0 bg-black/10 flex flex-col justify-end p-4'>
                            <div className='flex items-center mb-2'>
                                <LuUtensilsCrossed className='text-white text-xl mr-2' />
                                <span className='text-white text-lg font-bold'>Food Tour</span>
                            </div>
                            <p className='text-white text-xs opacity-90'>Street food • Markets</p>
                        </div>
                    </div>
                    <div className='relative overflow-hidden rounded-lg cursor-pointer group h-[156px]' onClick={() => handleInterestClick('Nature')}>
                        <Image src={r2Images.thaiNature} alt="Nature" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                        <div className='absolute inset-0 bg-black/10 flex flex-col justify-end p-4'>
                            <div className='flex items-center mb-2'>
                                <LuLeaf className='text-white text-xl mr-2' />
                                <span className='text-white text-lg font-bold'>Nature</span>
                            </div>
                            <p className='text-white text-xs opacity-90'>Wildlife • National parks</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='grid grid-cols-5 gap-2 mb-8'>
                <div className='col-span-1 relative overflow-hidden rounded-lg h-68 cursor-pointer group' onClick={() => handleInterestClick('Road Trips')}>
                    <Image src={r2Images.bangkok} alt="Road Trips" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                    <div className='absolute inset-0 bg-black/10 flex flex-col items-center justify-center p-4'>
                        <LuCar className='text-4xl mb-3 text-white' />
                        <span className='font-semibold text-lg text-white'>Road Trips</span>
                        <span className='text-xs text-white opacity-90 mt-1 text-center'>Scenic drives • Self-drive tours</span>
                    </div>
                </div>
                <div className='col-span-1 relative overflow-hidden rounded-lg h-68 cursor-pointer group' onClick={() => handleInterestClick('Cycling')}>
                    <Image src={r2Images.chiangmai} alt="Cycling" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                    <div className='absolute inset-0 bg-black/10 flex flex-col items-center justify-center p-4'>
                        <LuBike className='text-4xl mb-3 text-white' />
                        <span className='font-semibold text-lg text-white'>Cycling</span>
                        <span className='text-xs text-white opacity-90 mt-1 text-center'>City tours • Mountain biking</span>
                    </div>
                </div>
                <div className='col-span-1 relative overflow-hidden rounded-lg h-68 cursor-pointer group' onClick={() => handleInterestClick('Running')}>
                    <Image src={r2Images.phuket} alt="Running" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                    <div className='absolute inset-0 bg-black/10 flex flex-col items-center justify-center p-4'>
                        <LuActivity className='text-4xl mb-3 text-white' />
                        <span className='font-semibold text-lg text-white'>Running</span>
                        <span className='text-xs text-white opacity-90 mt-1 text-center'>Morning runs • Park jogging</span>
                    </div>
                </div>
                <div className='col-span-1 relative overflow-hidden rounded-lg h-68 cursor-pointer group' onClick={() => handleInterestClick('Shopping')}>
                    <Image src={r2Images.thaiMarket} alt="Shopping" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                    <div className='absolute inset-0 bg-black/10 flex flex-col items-center justify-center p-4'>
                        <LuShoppingBag className='text-4xl mb-3 text-white' />
                        <span className='font-semibold text-lg text-white'>Shopping</span>
                        <span className='text-xs text-white opacity-90 mt-1 text-center'>Malls • Local crafts</span>
                    </div>
                </div>
                <div className='col-span-1 relative overflow-hidden rounded-lg h-68 cursor-pointer group' onClick={() => handleInterestClick('Wellness')}>
                    <Image src={r2Images.thaiMessage} alt="Wellness" fill className='object-cover rounded-lg transition-transform duration-300 group-hover:scale-105' />
                    <div className='absolute inset-0 bg-black/10 flex flex-col items-center justify-center p-4'>
                        <LuSparkles className='text-4xl mb-3 text-white' />
                        <span className='font-semibold text-lg text-white'>Wellness</span>
                        <span className='text-xs text-white opacity-90 mt-1 text-center'>Spa • Meditation</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InterestsSection
