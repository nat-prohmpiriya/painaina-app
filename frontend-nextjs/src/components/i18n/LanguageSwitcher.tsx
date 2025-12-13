'use client'

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Language = {
  code: string;
  name: string;
  flag: string;
  enabled: boolean;
};

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', enabled: true },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', enabled: true },
  { code: 'ja', name: '日本語', flag: '🇯🇵', enabled: false },
  { code: 'zh', name: '中文', flag: '🇨🇳', enabled: false },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', enabled: false },
  { code: 'ko', name: '한국어', flag: '🇰🇷', enabled: false },
];

const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = LANGUAGES.find(lang => lang.code === locale) || LANGUAGES[0];

  const handleLanguageChange = (langCode: string) => {
    router.replace(pathname, { locale: langCode });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-1 hover:bg-gray-100"
        >
          <span className="text-base">{currentLanguage.flag}</span>
          <span className="text-sm">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            disabled={!lang.enabled}
            onClick={() => lang.enabled && handleLanguageChange(lang.code)}
            className={locale === lang.code ? 'bg-accent' : ''}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="text-lg">{lang.flag}</span>
              <span className={lang.enabled ? '' : 'text-gray-400'}>
                {lang.name}
              </span>
              {!lang.enabled && (
                <span className="ml-auto text-xs text-gray-400">(Coming soon)</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
