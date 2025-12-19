'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight } from 'lucide-react'

const HeroSection = () => {
  const t = useTranslations('landing')

  const popularDestinations = [
    {
      key: 'chiangMai',
      image: 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=600&q=80',
      guidesCount: 12
    },
    {
      key: 'phuket',
      image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&q=80',
      guidesCount: 8
    },
    {
      key: 'krabi',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',
      guidesCount: 6
    },
    {
      key: 'khaoYai',
      image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      guidesCount: 10
    },
    {
      key: 'koSamui',
      image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&q=80',
      guidesCount: 5
    }
  ]

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=80"
          alt="Thailand travel"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl">
          {/* Headline */}
          <div className="space-y-4 mb-8">
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-2xl lg:text-3xl text-white/90">
              {t('hero.subtitle')}
              <br />
              <span className="text-white/70">{t('hero.subtitleHighlight')}</span>
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/guides">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-semibold shadow-xl transition-all hover:-translate-y-0.5 rounded-full"
              >
                {t('hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                variant="outline"
                size="lg"
                className="bg-white border-primary text-primary hover:bg-primary hover:text-white px-8 py-6 text-lg font-semibold transition-all rounded-full"
              >
                {t('hero.ctaSecondary')}
              </Button>
            </Link>
          </div>

          {/* Popular Destinations */}
          <div>
            <p className="text-white/70 text-sm font-medium mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('hero.popularDestinations')}
            </p>
            <div className="flex flex-wrap gap-3">
              {popularDestinations.map((dest, index) => (
                <Link
                  key={index}
                  href={`/guides?destination=${encodeURIComponent(t(`destinations.${dest.key}`))}`}
                  className="group"
                >
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full pl-1 pr-4 py-1 transition-all">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative">
                      <Image
                        src={dest.image}
                        alt={t(`destinations.${dest.key}`)}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <span className="text-white font-medium text-sm">{t(`destinations.${dest.key}`)}</span>
                      <span className="text-white/60 text-xs ml-2">{dest.guidesCount} {t('hero.guides')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
