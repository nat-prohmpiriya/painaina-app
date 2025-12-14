'use client'

import { Button } from "@/components/ui/button"
import SignInButton from "../auth/SignInButton"
import NotificationBell from "../notification/NotificationBell"
import LanguageSwitcher from "../i18n/LanguageSwitcher"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { r2Images } from "@/lib/r2Images"

const HeaderApp = () => {
    const router = useRouter();
    const currentPage = usePathname();
    const { isAuthenticated } = useAuth();
    const t = useTranslations('common');
    const [currentBtn, setCurrentBtn] = useState<'trips' | 'guides' | 'books' | ''>('');

    useEffect(() => {
        const segments = currentPage.split('/');
        if (segments.length <= 3) {
            setCurrentBtn('');
            return;
        }
        if (currentPage?.includes('trips')) {
            setCurrentBtn('trips');
        } else if (currentPage?.includes('guides')) {
            setCurrentBtn('guides');
        } else if (currentPage?.includes('books')) {
            setCurrentBtn('books');
        } else {
            setCurrentBtn('');
        }
    }, [currentPage]);

    return (
        <div className="h-14 md:h-16 w-full shadow-md flex items-center sticky top-0 bg-white z-50">
            <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    onClick={() => router.push("/")}
                >
                    <Image
                        src={r2Images.logo128}
                        alt="PaiNaiNa Logo"
                        width={36}
                        height={36}
                        className="rounded-full"
                    />
                    <h1 className="text-lg md:text-xl font-bold">
                        PaiNaiNa
                    </h1>
                </div>

                {/* Desktop Navigation - Hidden on mobile */}
                <div className="hidden lg:flex items-center gap-3">
                    {/* Trips - Show only when authenticated */}
                    {isAuthenticated && (
                        <Button
                            variant={currentBtn === 'trips' ? 'default' : 'ghost'}
                            className="rounded-full"
                            onClick={() => {
                                router.push("/trips");
                                setCurrentBtn('trips');
                            }}
                        >
                            <span className="font-semibold">{t('trips')}</span>
                        </Button>
                    )}
                    {/* Travel Guides - Always visible */}
                    <Button
                        variant={currentBtn === 'guides' ? 'default' : 'ghost'}
                        className="rounded-full"
                        onClick={() => {
                            router.push("/guides");
                            setCurrentBtn('guides');
                        }}
                    >
                        <span className="font-semibold">{t('travelGuides')}</span>
                    </Button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Language Switcher - Show on both mobile and desktop */}
                    <LanguageSwitcher />

                    {/* Notification - Show on both mobile and desktop */}
                    {isAuthenticated && (
                        <NotificationBell />
                    )}

                    {/* Sign In / Avatar */}
                    <SignInButton />
                </div>
            </div>
        </div>
    )
}

export default HeaderApp
