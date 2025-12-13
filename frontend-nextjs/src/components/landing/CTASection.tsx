'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'

const CTASection = () => {
  const t = useTranslations('landing')

  const benefitKeys = ['free', 'noCard', 'noAds', 'noHidden'] as const

  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            {t('cta.title')}
            <br />
            {t('cta.titleHighlight')}
          </h2>

          {/* Subtext */}
          <p className="text-xl text-white/80 mb-8">
            {t('cta.subtitle')}
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefitKeys.map((key) => (
              <div
                key={key}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <Check className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">{t(`cta.benefits.${key}`)}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-white hover:bg-white/90 text-primary px-10 py-7 text-xl font-semibold shadow-2xl shadow-black/20 transition-all hover:shadow-black/30 hover:-translate-y-1"
            >
              {t('cta.button')}
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>

          {/* Small text */}
          <p className="text-white/60 text-sm mt-6">
            {t('cta.note')}
          </p>
        </div>
      </div>
    </section>
  )
}

export default CTASection
