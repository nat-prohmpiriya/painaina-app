'use client'

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUserQueries';
import ProfileInfo from '@/components/profile/ProfileInfo';
import CheckInSection from '@/components/profile/CheckInSection';
import TripList from '@/components/profile/TripList';
import GuideList from '@/components/profile/GuideList';
import { NotebookText, Compass, AlertCircle } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
    const { profileId } = useParams();
    const router = useRouter();
    const { isAuthenticated, user: currentUser } = useAuth();
    const t = useTranslations('profile');

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">{t('errors.needSignIn.title')}</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">{t('errors.needSignIn.subtitle')}</p>
                    <Button onClick={() => router.push('/')}>{t('errors.needSignIn.button')}</Button>
                </div>
            </div>
        );
    }

    return <ProfileContent profileId={profileId} currentUser={currentUser} />;
}

interface ProfileContentProps {
    profileId: string | string[] | undefined;
    currentUser: any;
}

const ProfileContent = ({ profileId, currentUser }: ProfileContentProps) => {
    const router = useRouter();
    const t = useTranslations('profile');

    // Get profile ID from URL (always run this before any early returns)
    const profileIdStr = Array.isArray(profileId) ? profileId[0] : profileId;

    // Memoize isOwnProfile to prevent hook order changes (must be before early returns)
    const isOwnProfile = useMemo(
        () => currentUser && profileIdStr === currentUser.id,
        [profileIdStr, currentUser]
    );

    // Fetch profile user data (only if viewing someone else's profile)
    // This hook must be called unconditionally
    const { data: profileUser, isLoading: isLoadingProfile } = useUser(
        profileIdStr,
        !isOwnProfile && !!currentUser // Only fetch if NOT viewing own profile AND user exists
    );

    // Now we can do early returns after all hooks
    if (currentUser === undefined) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-card rounded-lg border p-6">
                    <div className="text-center mb-6 space-y-4">
                        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                        <Skeleton className="h-4 w-2/3 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">{t('errors.notFound.title')}</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">{t('errors.notFound.subtitle')}</p>
                    <Button onClick={() => router.push('/')}>{t('errors.notFound.button')}</Button>
                </div>
            </div>
        );
    }

    // Use current user data if viewing own profile, otherwise use fetched profile data
    const displayUser = isOwnProfile ? currentUser : profileUser;

    // Show loading state while fetching other user's profile
    if (!isOwnProfile && isLoadingProfile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-card rounded-lg border p-6">
                    <div className="text-center mb-6 space-y-4">
                        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                        <Skeleton className="h-4 w-2/3 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    // Show 404 if other user's profile not found
    if (!isOwnProfile && !profileUser) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">{t('errors.profileNotFound.title')}</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">{t('errors.profileNotFound.subtitle')}</p>
                    <Button onClick={() => router.push('/')}>{t('errors.profileNotFound.button')}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto p-4'>
            {/* Responsive Grid: 1 col mobile, 7 cols desktop (2+5) */}
            <div className='grid grid-cols-1 lg:grid-cols-7 gap-4'>
                {/* Profile Info - Full width mobile, 2 cols desktop */}
                <div className='lg:col-span-2'>
                    <ProfileInfo user={displayUser} isOwnProfile={isOwnProfile} />
                </div>
                {/* Content - Full width mobile, 5 cols desktop */}
                <div className='lg:col-span-5'>
                    <CheckInSection />
                    <Tabs defaultValue="trips">
                        <TabsList>
                            <TabsTrigger value="trips">
                                <NotebookText className='inline mr-1' size={18} />
                                <span className='mr-2 text-sm font-semibold'>{t('tabs.trips')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="guides">
                                <Compass className='inline mr-1' size={18} />
                                <span className='mr-2 text-sm font-semibold'>{t('tabs.guides')}</span>
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="trips">
                            <TripList userId={profileIdStr} isOwnProfile={isOwnProfile} />
                        </TabsContent>
                        <TabsContent value="guides">
                            <GuideList userId={profileIdStr} isOwnProfile={isOwnProfile} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};