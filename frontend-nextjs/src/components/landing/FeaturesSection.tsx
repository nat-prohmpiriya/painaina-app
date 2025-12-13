'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  CalendarDays,
  MapPin,
  Users,
  Wallet,
  Compass,
  Copy,
  Star
} from 'lucide-react'

const FeaturesSection = () => {
  const t = useTranslations('landing')
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: CalendarDays,
      key: 'itinerary',
      tags: ['Itinerary', 'Day-by-day', 'Map View']
    },
    {
      icon: MapPin,
      key: 'places',
      tags: ['Google Places', 'Reviews', 'Photos']
    },
    {
      icon: Users,
      key: 'realtime',
      tags: ['Collaboration', 'Realtime', 'Share'],
      highlight: true
    },
    {
      icon: Wallet,
      key: 'expense',
      tags: ['Expense', 'Split', 'Settlement'],
      highlight: true
    },
    {
      icon: Compass,
      key: 'guides',
      tags: ['Discovery', 'Guides', 'Bookmark']
    },
    {
      icon: Copy,
      key: 'copy',
      tags: ['Copy', 'Template', 'Quick Start']
    }
  ]

  return (
    <section className="py-20 bg-[var(--cream)]">
      <div className="container mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Feature tabs - Left side */}
            <div className="lg:col-span-2 space-y-3">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-4
                    ${activeFeature === index
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'bg-white hover:bg-primary/5 border border-transparent hover:border-primary/20'
                    }
                    ${feature.highlight ? 'ring-2 ring-secondary/50' : ''}`}
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0
                      ${activeFeature === index ? 'bg-white/20' : 'bg-primary/10'}`}
                  >
                    <feature.icon
                      className={`w-5 h-5 ${activeFeature === index ? 'text-white' : 'text-primary'}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold ${activeFeature === index ? 'text-white' : 'text-foreground'}`}
                      >
                        {t(`features.list.${feature.key}.title`)}
                      </h3>
                      {feature.highlight && (
                        <Star
                          className={`w-4 h-4 ${activeFeature === index ? 'text-white' : 'text-primary'}`}
                          fill="currentColor"
                        />
                      )}
                    </div>
                    {activeFeature === index && (
                      <p className="text-sm text-white/80 mt-1 line-clamp-2">
                        {t(`features.list.${feature.key}.description`)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Feature preview - Right side */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-xl border border-border p-8 h-full">
                {/* Feature header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    {(() => {
                      const Icon = features[activeFeature].icon
                      return <Icon className="w-8 h-8 text-primary" />
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {t(`features.list.${features[activeFeature].key}.title`)}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {features[activeFeature].tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feature description */}
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {t(`features.list.${features[activeFeature].key}.description`)}
                </p>

                {/* Feature preview area */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 min-h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      {(() => {
                        const Icon = features[activeFeature].icon
                        return <Icon className="w-8 h-8 text-primary" />
                      })()}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t('features.preview')}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {t(`features.list.${features[activeFeature].key}.title`)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
