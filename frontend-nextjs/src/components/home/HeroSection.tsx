'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { r2Images } from '@/lib/r2Images'
import { LuMapPin, LuUsers, LuSparkles } from 'react-icons/lu'

const HeroSection = () => {
	const router = useRouter()
	const t = useTranslations('home.hero')

	const handleStartPlanning = () => {
		router.push('/trips')
	}

	const handleExploreGuides = () => {
		router.push('/guides')
	}

	return (
		<div className='relative'>
			{/* Hero Content */}
			<div className='container mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-8'>
				<div className='flex flex-col items-center text-center max-w-4xl mx-auto'>
					{/* Badge */}
					<div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6'>
						<LuSparkles className='w-4 h-4' />
						<span>Plan your perfect Thailand trip</span>
					</div>

					{/* Main Headline */}
					<h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6'>
						<span className='text-foreground'>Your Trip.</span>{' '}
						<span className='text-primary'>Your Way.</span>
					</h1>

					{/* Subtitle */}
					<p className='text-lg md:text-xl text-muted-foreground max-w-2xl mb-8'>
						{t('subtitle')}
					</p>

					{/* CTA Buttons */}
					<div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
						<Button
							size='lg'
							className='h-14 px-8 text-lg font-semibold rounded-full bg-secondary hover:bg-secondary/90'
							onClick={handleStartPlanning}
						>
							{t('cta')}
						</Button>
						<Button
							size='lg'
							variant='outline'
							className='h-14 px-8 text-lg font-semibold rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground'
							onClick={handleExploreGuides}
						>
							Explore Guides
						</Button>
					</div>

					{/* Trust Indicators */}
					<div className='flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground'>
						<div className='flex items-center gap-2'>
							<LuMapPin className='w-5 h-5 text-primary' />
							<span>10,000+ Places</span>
						</div>
						<div className='flex items-center gap-2'>
							<LuUsers className='w-5 h-5 text-primary' />
							<span>Collaborate with Friends</span>
						</div>
						<div className='flex items-center gap-2'>
							<LuSparkles className='w-5 h-5 text-primary' />
							<span>AI-Powered Planning</span>
						</div>
					</div>
				</div>
			</div>

			{/* App Screenshot */}
			<div className='container mx-auto px-4 md:px-6 pb-16'>
				<div className='relative w-full max-w-6xl mx-auto'>
					<div className='relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border border-border'>
						<Image
							src={r2Images.travelPlannerDesktop}
							alt="PaiNaiNa Trip Planner"
							fill
							className='object-cover'
							priority
						/>
					</div>
					{/* Decorative gradient behind image */}
					<div className='absolute -z-10 inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl scale-110' />
				</div>
			</div>

			{/* Secondary Section */}
			<div className='container mx-auto px-4 md:px-6 py-16 border-t border-border'>
				<div className='flex flex-col items-center text-center max-w-3xl mx-auto'>
					<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-4'>
						{t('secondaryTitle')}
					</h2>
					<p className='text-lg text-muted-foreground'>
						{t('secondarySubtitle')}
					</p>
				</div>
			</div>
		</div>
	)
}

export default HeroSection
