'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { MapPin, Mail, Facebook, Instagram, Twitter } from 'lucide-react'

const FooterSection = () => {
  const t = useTranslations('landing')
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { key: 'guides', href: '/guides' },
      { key: 'features', href: '#features' },
      { key: 'howItWorks', href: '#how-it-works' }
    ],
    company: [
      { key: 'about', href: '/about' },
      { key: 'contact', href: '/contact' }
    ],
    legal: [
      { key: 'terms', href: '/terms' },
      { key: 'privacy', href: '/privacy' }
    ]
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' }
  ]

  return (
    <footer className="bg-gradient-to-tr from-black via-neutral-900 to-neutral-800 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <h3 className="text-2xl font-bold text-white">
                {t('footer.brand')}
              </h3>
            </Link>
            <p className="text-white/70 mb-6 max-w-sm leading-relaxed">
              {t('footer.tagline')}
              {' '}
              {t('footer.taglineTh')}
            </p>

            {/* Social links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.product')}</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {t(`footer.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.company')}</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {t(`footer.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {t(`footer.links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact info */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{t('footer.location')}</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Mail className="w-4 h-4" />
                <span>hello@painaina.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {currentYear} {t('footer.copyright')}
          </p>

          {/* Language switcher placeholder */}
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              TH
            </button>
            <button className="px-3 py-1 text-sm text-white/50 hover:text-white transition-colors rounded-full">
              EN
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterSection
