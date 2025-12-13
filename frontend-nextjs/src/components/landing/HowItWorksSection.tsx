'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Copy, Users, Plane, Check } from 'lucide-react'

const HowItWorksSection = () => {
  const t = useTranslations('landing')
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      number: 1,
      icon: Search,
      key: 'search',
      previewItems: ['เขาใหญ่ 3 วัน Cafe Hopping', 'ภูเก็ต 5 วัน Beach & Party', 'เชียงใหม่ วัด + คาเฟ่']
    },
    {
      number: 2,
      icon: Copy,
      key: 'copy',
      previewItems: null // Will use translation
    },
    {
      number: 3,
      icon: Users,
      key: 'collaborate',
      previewItems: ['นุ่น (Owner)', 'บอส (Editor)', 'ก้อย (Viewer)']
    },
    {
      number: 4,
      icon: Plane,
      key: 'travel',
      previewItems: ['นุ่น → บอส ฿1,250', 'ก้อย → นุ่น ฿800', 'Total: ฿15,000']
    }
  ]

  const getPreviewItems = (step: typeof steps[0]) => {
    if (step.key === 'copy') {
      return t.raw('howItWorks.steps.copy.items') as string[]
    }
    if (step.key === 'collaborate') {
      return [...step.previewItems!, t('howItWorks.steps.collaborate.invite')]
    }
    return step.previewItems!
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Step indicators */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-2 md:gap-4">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold transition-all
                      ${activeStep === index
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'bg-muted text-muted-foreground hover:bg-primary/10'
                      }`}
                  >
                    {activeStep > index ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 md:w-16 h-1 rounded transition-colors
                        ${activeStep > index ? 'bg-primary' : 'bg-muted'}`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Description */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  {(() => {
                    const Icon = steps[activeStep].icon
                    return <Icon className="w-8 h-8 text-primary" />
                  })()}
                </div>
                <div>
                  <p className="text-sm text-primary font-medium">
                    {t('howItWorks.step')} {steps[activeStep].number}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {t(`howItWorks.steps.${steps[activeStep].key}.title`)}
                  </h3>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {t(`howItWorks.steps.${steps[activeStep].key}.description`)}
              </p>

              {/* Step navigation */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← {t('howItWorks.prev')}
                </button>
                <button
                  onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                  disabled={activeStep === steps.length - 1}
                  className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('howItWorks.next')} →
                </button>
              </div>
            </div>

            {/* Right - Preview */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-xl border border-border p-6 transform hover:scale-[1.02] transition-transform">
                {/* Preview header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>

                {/* Preview content */}
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-xl">
                    <h4 className="font-semibold text-foreground mb-1">
                      {t(`howItWorks.steps.${steps[activeStep].key}.previewTitle`)}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t(`howItWorks.steps.${steps[activeStep].key}.previewSubtitle`)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {getPreviewItems(steps[activeStep]).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative */}
              <div className="absolute -z-10 top-4 left-4 right-4 bottom-4 bg-primary/10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
