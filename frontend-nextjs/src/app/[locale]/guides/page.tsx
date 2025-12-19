'use client'

import BookingForm from '@/components/book/BookingForm'
import { Input } from '@/components/ui/input'
import { FooterSection } from '@/components/landing'
import Image from 'next/image'
import { r2Images } from '@/lib/r2Images'
import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

const GuidesPage = () => {
	const router = useRouter()
	const [searchKeyword, setSearchKeyword] = useState('')
	const t = useTranslations('guides')

	const handleSearch = (value: string) => {
		if (value.trim()) {
			router.push(`/guides/search?q=${encodeURIComponent(value.trim())}`)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearch(searchKeyword)
		}
	}

	const handleDestinationClick = (destination: string) => {
		router.push(`/guides/search?q=${encodeURIComponent(destination)}`)
	}

	const handleInterestClick = (interest: string) => {
		router.push(`/guides/search?tags=${encodeURIComponent(interest)}`)
	}

	const tabItems = [
		{
			key: 'thailand',
			label: <span className='font-semibold text-sm'>Thailand</span>,
			children: <div>Thailand</div>
		},
		{
			key: 'indonesia',
			label: <span className='font-semibold text-sm'>Indonesia</span>,
			children: <div>Indonesia</div>
		},
		{
			key: 'philippines',
			label: <span className='font-semibold text-sm'>Philippines</span>,
			children: <div>Philippines</div>
		},
		{
			key: 'vietnam',
			label: <span className='font-semibold text-sm'>Vietnam</span>,
			children: <div>Vietnam</div>
		},
		{
			key: 'japan',
			label: <span className='font-semibold text-sm'>Japan</span>,
			children: <div>Japan</div>
		},
		{
			key: 'taiwan',
			label: <span className='font-semibold text-sm'>Taiwan</span>,
			children: <div>Taiwan</div>
		},
		{
			key: 'korea',
			label: <span className='font-semibold text-sm'>Korea</span>,
			children: <div>Korea</div>
		}
	]

	const interests = [
		{ key: 'food', nameEn: 'Food', img: r2Images.thaifood },
		{ key: 'temples', nameEn: 'Temples', img: r2Images.temples },
		{ key: 'nightlife', nameEn: 'Nightlife', img: r2Images.nightlife },
		{ key: 'historicalSites', nameEn: 'Historical Sites', img: r2Images.historicalSite },
		{ key: 'markets', nameEn: 'Markets', img: r2Images.thaiMarket },
		{ key: 'beaches', nameEn: 'Beaches', img: r2Images.beaches },
		{ key: 'nature', nameEn: 'Nature', img: r2Images.thaiNature },
		{ key: 'thaiMassageSpa', nameEn: 'Thai Massage & Spa', img: r2Images.thaiMessage },
		{ key: 'festivals', nameEn: 'Festivals', img: r2Images.festivals },
	]

	return (
		<div className='min-h-screen'>
			{/* Hero Section - Responsive */}
			<div className='mb-6 h-[50vh] md:h-[60vh] bg-gray-200 flex items-center justify-center bg-black' style={{ backgroundImage: `url(${r2Images.guideExplore})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
				<div className='bg-black/20 h-full w-full'>
					<div className='container mx-auto h-full flex flex-col justify-center text-white px-4 md:px-6'>
						<div className='max-w-4xl'>
							<h1 className='text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4'>
								{t('hero.title')}
							</h1>
							<p className='text-base sm:text-lg md:text-xl mb-4 md:mb-6'>
								{t('hero.subtitle')}
							</p>
							<div className='w-full md:w-3/4 lg:w-2/3'>
								<Input
									placeholder={t('hero.searchPlaceholder')}
									className='w-full h-12 rounded-2xl'
									value={searchKeyword}
									onChange={(e) => setSearchKeyword(e.target.value)}
									onKeyDown={handleKeyPress}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Grid - Responsive: 1 col mobile, 6 cols desktop (4+2) */}
			<div className='container mx-auto grid grid-cols-1 lg:grid-cols-6 gap-4 px-4 md:px-6'>
				{/* Main Content - Full width on mobile, 4 cols on desktop */}
				<div className='lg:col-span-4'>
					{/* <div className='grid grid-cols-5 gap-2 mb-2'>
						<div className='col-span-3 bg-gray-100 rounded-md h-82'>
							<div className='bg-gray-100 rounded-md h-full relative overflow-hidden cursor-pointer'>
								<img src={imgUrl} alt='feature image' className='w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-300' />
								<div className='absolute bottom-2 left-2 text-white'>
									<p className='text-sm'>Camping Japan</p>
									<p className='text-3xl font-semibold'>Beating Summer's Heat Camping in the Mountains of Ngano</p>
								</div>
							</div>
						</div>
						<div className='col-span-2 rounded-md flex flex-col gap-2'>
							<div className='bg-gray-100 rounded-md h-40 relative overflow-hidden cursor-pointer'>
								<img src={imgUrl} alt='feature image' className='w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-300' />
								<div className='absolute bottom-2 left-2 text-white'>
									<p className='text-sm'>Sponsored story</p>
									<p className='text-lg font-semibold'>Guide to Welcome Suica Mobile</p>
								</div>
							</div>
							<div className='bg-gray-100 rounded-md h-40 relative overflow-hidden cursor-pointer'>
								<img src={imgUrl} alt='feature image' className='w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-300' />
								<div className='absolute bottom-2 left-2 text-white'>
									<p className='text-sm'>Traveling with Kids</p>
									<p className='text-lg font-semibold'>Experiencing real-life Job at Kidzania Tokyo</p>
								</div>
							</div>

						</div>
					</div>
					<div className='grid grid-cols-2 gap-2 mb-4'>
						<div className='bg-gray-100 rounded-md h-48 w-full relative overflow-hidden cursor-pointer'>
							<img src={imgUrl} alt='feature image' className='w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-300' />
							<div className='absolute bottom-2 left-2 text-white'>
								<p className='text-sm'>Sponsored story</p>
								<p className='text-xl font-semibold'>A day in Arashiyama with Gold Guide</p>
							</div>
						</div>
						<div className='bg-gray-100 rounded-md h-48 w-full relative overflow-hidden cursor-pointer'>
							<img src={imgUrl} alt='feature image' className='w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-300' />
							<div className='absolute bottom-2 left-2 text-white'>
								<p className='text-sm'>Travel News</p>
								<p className='text-xl font-semibold'>Simple Guide For The 2025 Osaka Expo</p>
							</div>
						</div>
					</div> */}

					{/* Regions of Thailand */}
					{/* <div className='h-[80vh] w-full'>  */}
					{/* <Tabs items={tabItems} /> */}
					{/* Map interact */}
					{/* </div> */}

					{/* Popular Destinations - Responsive */}
					<div>
						<h3 className='text-2xl md:text-3xl font-bold mb-4'>{t('popularDestinations.title')}</h3>

						{/* Top Grid - 1 col mobile, 3 cols tablet/desktop */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3'>
							{/* Bangkok - Full width mobile, 2 cols tablet+ */}
							<div className='md:col-span-2'>
								<div
									className='h-64 md:h-80 lg:h-96 w-full bg-gray-100 overflow-hidden cursor-pointer relative rounded-md'
									onClick={() => handleDestinationClick('Bangkok')}
								>
									<Image src={r2Images.bangkok3} alt='Bangkok' fill className='object-cover rounded-md hover:scale-105 transition-transform duration-300' />
									<div className='absolute bottom-0 w-full px-3 md:px-4 text-white font-semibold flex'>
										<p className='text-lg md:text-xl mb-2'>{t('popularDestinations.bangkok')}</p>
									</div>
								</div>
							</div>

							{/* Chiang Mai & Phuket - Stack on mobile, 1 col on tablet+ */}
							<div className='md:col-span-1 flex flex-col gap-2 md:gap-3'>
								<div
									className='h-32 md:h-38 lg:h-48 w-full bg-gray-100 overflow-hidden cursor-pointer relative rounded-md'
									onClick={() => handleDestinationClick('Chiang Mai')}
								>
									<Image src={r2Images.chiangmai} alt='Chiang Mai' fill className='object-cover rounded-md hover:scale-105 transition-transform duration-300' />
									<div className='absolute bottom-0 w-full px-3 md:px-4 text-white font-semibold flex'>
										<p className='text-base md:text-xl mb-2'>{t('popularDestinations.chiangMai')}</p>
									</div>
								</div>
								<div
									className='h-32 md:h-38 lg:h-48 w-full bg-gray-100 overflow-hidden cursor-pointer relative rounded-md'
									onClick={() => handleDestinationClick('Phuket')}
								>
									<Image src={r2Images.phuket} alt='Phuket' fill className='object-cover rounded-md hover:scale-105 transition-transform duration-300' />
									<div className='absolute bottom-0 w-full px-3 md:px-4 text-white font-semibold flex'>
										<p className='text-base md:text-xl mb-2'>{t('popularDestinations.phuket')}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Bottom Grid - 2 cols mobile, 4 cols desktop */}
						<div className='grid grid-cols-2 md:grid-cols-4 w-full gap-2 md:gap-3 mt-2 md:mt-3'>
							{
								[
									{ key: 'krabi', name: 'Krabi', img: r2Images.krabi },
									{ key: 'ayutthaya', name: 'Ayutthaya', img: r2Images.ayutthaya },
									{ key: 'huaHin', name: 'Hua Hin', img: r2Images.huahin },
									{ key: 'pattaya', name: 'Pattaya', img: r2Images.pattaya }
								].map((item, index) => (
									<div
										key={index}
										className='h-40 md:h-48 w-full bg-gray-100 overflow-hidden cursor-pointer relative rounded-md'
										onClick={() => handleDestinationClick(item.name)}
									>
										<Image src={item.img} alt={item.name} fill className='object-cover rounded-md hover:scale-105 transition-transform duration-300' />
										<div className='absolute bottom-0 w-full px-3 md:px-4 text-white font-semibold flex'>
											<p className='text-base md:text-xl mb-2'>{t(`popularDestinations.${item.key}`)}</p>
										</div>
									</div>
								))
							}
						</div>
					</div>
					{/* Find your interest - Responsive */}
					<h3 className='text-2xl md:text-3xl font-bold mb-4 mt-6 md:mt-8'>{t('interests.title')}</h3>
					{/* Grid: 2 cols mobile, 3 cols tablet+ */}
					<div className='grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 my-4'>
						{
							interests.map((item, index) => (
								<div
									key={index}
									className='h-40 md:h-48 w-full bg-gray-100 overflow-hidden cursor-pointer relative rounded-md'
									onClick={() => handleInterestClick(item.nameEn)}
								>
									<Image src={item.img} alt={item.nameEn} fill className='object-cover rounded-md hover:scale-105 transition-transform duration-300' />
									<div className='absolute bottom-0 w-full px-3 md:px-4 text-white font-semibold flex'>
										<p className='text-base md:text-xl text-center mb-2'>{t(`interests.${item.key}`)}</p>
									</div>
								</div>
							))
						}
					</div>
					{/* Thailand travel news */}
					{/* <div>
						<h3 className='text-3xl font-bold mb-4 mt-8'>Thailand travel news</h3>
						{
							[
								{ meta: 'Advertiser Content', title: 'Hiroshima Station completes major facelift', shortContent: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum quae vitae iste.' },
								{ meta: 'Advertiser Content', title: 'Hiroshima Station completes major facelift', shortContent: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odio, totam.' },
								{ meta: 'Advertiser Content', title: 'Hiroshima Station completes major facelift', shortContent: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro corporis iure consequatur earum dolore qui.' },
								{ meta: 'Advertiser Content', title: 'Hiroshima Station completes major facelift', shortContent: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum quae vitae iste.' },
								{ meta: 'Advertiser Content', title: 'Hiroshima Station completes major facelift', shortContent: 'lorem ipsum dolor sit amet' },
							].map((item, index) => (
								<div key={index} className='w-full overflow-hidden cursor-pointer rounded-md mb-4 flex justify-between gap-4 h-32 py-2 px-2 border-b border-gray-200'>
									<div className='w-full flex flex-col px-4 justify-center'>
										<h4 className='font-semibold text-xs text-gray-500'>{item.meta}</h4>
										<p className='text-lg font-semibold hover:text-red-500 duration-300 transition-all'>{item.title}</p>
										<p className='text-gray-400 text-sm '>{item.shortContent}</p>
									</div>
									<img src={imgUrl} className='w-48 h-full object-cover' />
								</div>
							))
						}
					</div> */}
					{/* Search Guide */}
					{/* <div>
						<h3 className='text-3xl font-bold mb-4 mt-8'>Search Guide your interests</h3>
						<div className='w-5/10'>
							<Select
								mode='multiple'
								style={{
									width: '100%',
									borderRadius: '16px !important',
									marginBottom: '16px',
									height: '38px',

								}}
							>

							</Select>
							<AutoComplete style={{ width: '100%' }}>
								<Input
									size='large'
									type="text"
									placeholder='Search by keyword, destination, activity...'
									style={{ width: '100%', borderRadius: '16px' }}
								/>
							</AutoComplete>
						</div>
						<div className='my-8 flex justify-end'>
							<Pagination defaultCurrent={1} total={100} />
						</div>
						<div className='my-8 grid grid-cols-3 gap-4'>
							{
								[1, 2, 3, 4, 5, 6].map((item, index) => (
									<div key={index} className='w-[275px] flex flex-col rounded-lg'>
										<img src={imgUrl} className='w-full h-full object-cover rounded-t-lg' />
										<div className='w-full flex flex-col p-4 justify-center border border-t-0 border-gray-200 rounded-b-lg'>
											<h4 className='font-semibold text-xs text-gray-500'>Travel Guide</h4>
											<p className='text-lg font-semibold hover:text-red-500 duration-300 transition-all'>Beating Summer's Heat Camping in the Mountains of Ngano</p>
											<p className='text-gray-400 text-sm '>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum quae vitae iste.</p>
										</div>
									</div>
								))
							}
						</div>
						<div className='my-8 flex justify-end'>
							<Pagination defaultCurrent={1} total={100} />
						</div>
					</div> */}


				</div>

				{/* Right Sidebar - Hidden on mobile, visible on desktop */}
				<div className='hidden lg:flex lg:col-span-2 flex-col items-center gap-4'>
					<div className='bg-gray-200 h-48 flex items-center justify-center rounded-md w-full'>
						{t('sidebar.sponsorBanner')}
					</div>
					<BookingForm />
					<div className='bg-gray-200 h-48 flex items-center justify-center rounded-md w-full'>
						{t('sidebar.sponsorBanner')}
					</div>
					<div className='bg-gray-200 h-96 flex items-center justify-center rounded-md w-full'>
						{t('sidebar.sponsorBanner')}
					</div>
				</div>

			</div>

			{/* Mobile Booking Form - Show only on mobile */}
			<div className='lg:hidden px-4 md:px-6 mt-6 mb-8'>
				<BookingForm />
			</div>
			<FooterSection />
		</div>
	)
}

export default GuidesPage
