import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // A list of all locales that are supported
    // Currently enabled: en, th
    // Coming soon: ja (Japanese), zh (Chinese), vi (Vietnamese), ko (Korean)
    locales: ['en', 'th', 'ja', 'zh', 'vi', 'ko'],

    // Used when no locale matches
    defaultLocale: 'en',
    localePrefix: 'always',
});