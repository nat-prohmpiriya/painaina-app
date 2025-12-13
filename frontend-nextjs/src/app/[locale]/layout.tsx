import type { Metadata } from "next";
import { Bai_Jamjuree } from 'next/font/google';
import "../globals.css";
import AppProvider from "@/providers/AppProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { GoogleAnalytics } from '@next/third-parties/google'

const baiJamjuree = Bai_Jamjuree({
  subsets: ['thai', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-bai-jamjuree',
  display: 'swap',
});

const GA_ID = process.env.GA_ID || process.env.NEXT_PUBLIC_GA_ID || '';

export const metadata: Metadata = {
  title: "Painaina - Trip Planner",
  description: "Plan your next trip with ease",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  if (!GA_ID) {
    console.warn('Google Analytics ID is not defined. Please set NEXT_PUBLIC_GA_ID environment variable.');
  } else {
    console.log(`Google Analytics ID: ${GA_ID}`);
  }
  return (
    <html lang={locale}>
      <body className={`${baiJamjuree.variable} font-sans`}>
        <GoogleAnalytics gaId={GA_ID} />
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            {children}
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
