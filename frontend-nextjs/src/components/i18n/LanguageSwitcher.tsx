'use client'

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';

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

  const menuItems: MenuProps['items'] = LANGUAGES.map((lang) => ({
    key: lang.code,
    label: (
      <div className="flex items-center gap-2 min-w-[140px]">
        <span className="text-lg">{lang.flag}</span>
        <span className={lang.enabled ? '' : 'text-gray-400'}>
          {lang.name}
        </span>
        {!lang.enabled && (
          <span className="ml-auto text-xs text-gray-400">(Coming soon)</span>
        )}
      </div>
    ),
    disabled: !lang.enabled,
    onClick: lang.enabled ? () => handleLanguageChange(lang.code) : undefined,
  }));

  return (
    <Dropdown
      menu={{ items: menuItems, selectedKeys: [locale] }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Button
        type="text"
        className="flex items-center gap-1 hover:bg-gray-100"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="text-sm">{currentLanguage.code.toUpperCase()}</span>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
