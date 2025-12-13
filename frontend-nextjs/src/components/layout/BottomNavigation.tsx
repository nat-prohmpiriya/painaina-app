'use client'

import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { IoHome, IoBook, IoAirplane, IoPerson } from "react-icons/io5"
import { useAuth } from '@/hooks/useAuth'
import { SignInButton } from '@clerk/nextjs'

const BottomNavigation = () => {
    const router = useRouter();
    const currentPage = usePathname();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'home' | 'guides' | 'trips' | 'profile'>('home');

    useEffect(() => {
        if (currentPage === '/') {
            setActiveTab('home');
        } else if (currentPage?.includes('guides')) {
            setActiveTab('guides');
        } else if (currentPage?.includes('trips')) {
            setActiveTab('trips');
        } else if (currentPage?.includes('profile') || currentPage?.includes('user')) {
            setActiveTab('profile');
        }
    }, [currentPage]);

    const handleNavigation = (tab: 'home' | 'guides' | 'trips' | 'profile') => {
        setActiveTab(tab);
        switch (tab) {
            case 'home':
                router.push('/');
                break;
            case 'guides':
                router.push('/guides');
                break;
            case 'trips':
                // Only called when user is authenticated
                router.push('/trips');
                break;
            case 'profile':
                // Only called when user is authenticated
                if (user) {
                    router.push(`/profiles/${user.id}`);
                }
                break;
        }
    };

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="flex items-center justify-around h-16 px-2">
                {/* Home */}
                <button
                    onClick={() => handleNavigation('home')}
                    className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${activeTab === 'home' ? 'text-red-500' : 'text-gray-500'
                        }`}
                >
                    <IoHome size={24} />
                    <span className="text-xs mt-1 font-medium">Home</span>
                </button>

                {/* Guides */}
                <button
                    onClick={() => handleNavigation('guides')}
                    className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${activeTab === 'guides' ? 'text-red-500' : 'text-gray-500'
                        }`}
                >
                    <IoBook size={24} />
                    <span className="text-xs mt-1 font-medium">Guides</span>
                </button>

                {/* Trips - Protected */}
                {user ? (
                    <button
                        onClick={() => handleNavigation('trips')}
                        className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${activeTab === 'trips' ? 'text-red-500' : 'text-gray-500'
                            }`}
                    >
                        <IoAirplane size={24} />
                        <span className="text-xs mt-1 font-medium">Trips</span>
                    </button>
                ) : (
                    <SignInButton mode="modal">
                        <button
                            className="flex flex-col items-center justify-center flex-1 py-2 transition-colors text-gray-500"
                        >
                            <IoAirplane size={24} />
                            <span className="text-xs mt-1 font-medium">Trips</span>
                        </button>
                    </SignInButton>
                )}

                {/* Profile - Protected */}
                {user ? (
                    <button
                        onClick={() => handleNavigation('profile')}
                        className="flex flex-col items-center justify-center flex-1 py-2"
                    >
                        <div className={`relative ${activeTab === 'profile' ? 'ring-2 ring-red-500' : ''} rounded-full`}>
                            <img
                                src={user.photoUrl}
                                alt={user.name || 'Profile'}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        </div>
                        <span className={`text-xs mt-1 font-medium transition-colors ${activeTab === 'profile' ? 'text-red-500' : 'text-gray-500'}`}>
                            Profile
                        </span>
                    </button>
                ) : (
                    <SignInButton mode="modal">
                        <button
                            className="flex flex-col items-center justify-center flex-1 py-2 transition-colors text-gray-500"
                        >
                            <IoPerson size={24} />
                            <span className="text-xs mt-1 font-medium">Profile</span>
                        </button>
                    </SignInButton>
                )}
            </div>
        </div>
    )
}

export default BottomNavigation
