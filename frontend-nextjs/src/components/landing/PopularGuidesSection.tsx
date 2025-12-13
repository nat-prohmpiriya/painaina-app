'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Eye, Bookmark, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PopularGuidesSection = () => {
  const t = useTranslations('landing')

  // Static guides with Unsplash images
  const guides = [
    {
      id: '1',
      titleKey: 'khaoYai',
      title: 'เขาใหญ่ 3 วัน 2 คืน',
      titleEn: 'Khao Yai 3D2N',
      subtitle: 'Cafe Hopping + Nature',
      image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80',
      duration: '3D',
      viewCount: 1234,
      bookmarkCount: 89,
      author: 'Noon'
    },
    {
      id: '2',
      titleKey: 'phuket',
      title: 'ภูเก็ต 5 วัน 4 คืน',
      titleEn: 'Phuket 5D4N',
      subtitle: 'Beach & Party',
      image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80',
      duration: '5D',
      viewCount: 890,
      bookmarkCount: 67,
      author: 'Boss'
    },
    {
      id: '3',
      titleKey: 'chiangMai',
      title: 'เชียงใหม่ 4 วัน 3 คืน',
      titleEn: 'Chiang Mai 4D3N',
      subtitle: 'Temple + Cafe + Mountain',
      image: 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800&q=80',
      duration: '4D',
      viewCount: 2100,
      bookmarkCount: 156,
      author: 'Koi'
    },
    {
      id: '4',
      titleKey: 'krabi',
      title: 'กระบี่ 3 วัน 2 คืน',
      titleEn: 'Krabi 3D2N',
      subtitle: 'Sea + Island Hopping',
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
      duration: '3D',
      viewCount: 650,
      bookmarkCount: 45,
      author: 'Tom'
    },
    {
      id: '5',
      titleKey: 'koSamui',
      title: 'เกาะสมุย 4 วัน 3 คืน',
      titleEn: 'Koh Samui 4D3N',
      subtitle: 'Luxury Beach Retreat',
      image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&q=80',
      duration: '4D',
      viewCount: 520,
      bookmarkCount: 38,
      author: 'Min'
    },
    {
      id: '6',
      titleKey: 'pattaya',
      title: 'พัทยา 2 วัน 1 คืน',
      titleEn: 'Pattaya 2D1N',
      subtitle: 'Weekend Getaway',
      image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
      duration: '2D',
      viewCount: 780,
      bookmarkCount: 52,
      author: 'James'
    }
  ]

  return (
    <section className="py-20 bg-[var(--cream)]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-primary font-medium mb-2">{t('popularGuides.tagline')}</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {t('popularGuides.title')}
            </h2>
            <p className="text-muted-foreground max-w-xl">
              {t('popularGuides.subtitle')}
            </p>
          </div>
          <Link href="/guides">
            <Button variant="outline" className="hidden md:flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-white">
              {t('popularGuides.viewAll')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Guide Cards - Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link key={guide.id} href={`/guides/${guide.id}`}>
              <div className="group bg-white rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-xl hover:border-primary/20 transition-all duration-300 h-full">
                {/* Image */}
                <div className="aspect-[16/10] relative overflow-hidden">
                  <Image
                    src={guide.image}
                    alt={guide.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Duration badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
                    <Clock className="w-3 h-3" />
                    {guide.duration}
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white/80 text-sm mb-1">{t(`destinations.${guide.titleKey}`)}</p>
                    <h3 className="font-bold text-white text-lg leading-tight">
                      {guide.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-muted-foreground text-sm mb-4">
                    {guide.subtitle}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{t('popularGuides.by')} {guide.author}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{guide.viewCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{guide.bookmarkCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Link href="/guides">
            <Button className="w-full bg-primary text-white">
              {t('popularGuides.viewAll')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PopularGuidesSection
