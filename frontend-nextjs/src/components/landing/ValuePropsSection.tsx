'use client'

import { useTranslations } from 'next-intl'
import { Search, ClipboardList, Wallet, ArrowRight } from 'lucide-react'

const ValuePropsSection = () => {
  const t = useTranslations('landing')

  const valueProps = [
    {
      step: 1,
      icon: Search,
      key: 'discover',
      color: 'bg-primary',
      lightColor: 'bg-primary/10',
      textColor: 'text-primary'
    },
    {
      step: 2,
      icon: ClipboardList,
      key: 'plan',
      color: 'bg-primary/80',
      lightColor: 'bg-primary/10',
      textColor: 'text-primary'
    },
    {
      step: 3,
      icon: Wallet,
      key: 'split',
      color: 'bg-primary/60',
      lightColor: 'bg-primary/10',
      textColor: 'text-primary',
      highlight: true
    }
  ]

  return (
    <section className="py-20 bg-[var(--cream)]">
      <div className="container mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('valueProps.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('valueProps.subtitle')}
          </p>
        </div>

        {/* Value Props with Flow */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines (desktop only) */}
            <div className="hidden md:block absolute top-24 left-1/3 w-1/3 h-0.5 bg-primary/30" />
            <div className="hidden md:block absolute top-24 left-2/3 w-1/3 h-0.5 bg-primary/30" />

            {valueProps.map((prop, index) => (
              <div
                key={index}
                className={`relative group ${prop.highlight ? 'md:-mt-4' : ''}`}
              >
                {/* Card */}
                <div
                  className={`bg-white rounded-xl p-8 shadow-sm border-2 transition-all duration-300 h-full
                    ${prop.highlight
                      ? 'border-primary/20 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20'
                      : 'border-transparent hover:border-primary/20 hover:shadow-lg'
                    }`}
                >
                  {/* Highlight badge */}
                  {prop.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {t('valueProps.usp')}
                    </div>
                  )}

                  {/* Step number */}
                  <div
                    className={`w-12 h-12 ${prop.color} text-white rounded-xl flex items-center justify-center text-xl font-bold mb-6 shadow-lg`}
                  >
                    {prop.step}
                  </div>

                  {/* Icon */}
                  <div className={`${prop.lightColor} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                    <prop.icon className={`w-8 h-8 ${prop.textColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {t(`valueProps.${prop.key}.title`)}
                  </h3>
                  <p className={`${prop.textColor} font-medium mb-4`}>
                    {t(`valueProps.${prop.key}.subtitle`)}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`valueProps.${prop.key}.description`)}
                  </p>
                </div>

                {/* Arrow (mobile only) */}
                {index < valueProps.length - 1 && (
                  <div className="md:hidden flex justify-center my-4">
                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ValuePropsSection
