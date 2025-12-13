'use client'

import { Skeleton, Result, Button, Tabs, Card } from 'antd';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUserQueries';
import ProfileInfo from '@/components/profile/ProfileInfo';
import CheckInSection from '@/components/profile/CheckInSection';
import TripList from '@/components/profile/TripList';
import GuideList from '@/components/profile/GuideList';
import { LuNotebookText, LuCompass } from "react-icons/lu";
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
    const { profileId } = useParams();
    const router = useRouter();
    const { isAuthenticated, user: currentUser } = useAuth();
    const t = useTranslations('profile');

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Result
                    status="403"
                    title={t('errors.needSignIn.title')}
                    subTitle={t('errors.needSignIn.subtitle')}
                    extra={<Button type="primary" onClick={() => router.push('/')}>{t('errors.needSignIn.button')}</Button>}
                />
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
                <Card>
                    <div className="text-center mb-6">
                        <Skeleton.Avatar active size={120} />
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </div>
                </Card>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Result
                    status="404"
                    title={t('errors.notFound.title')}
                    subTitle={t('errors.notFound.subtitle')}
                    extra={<Button type="primary" onClick={() => router.push('/')}>{t('errors.notFound.button')}</Button>}
                />
            </div>
        );
    }

    // Use current user data if viewing own profile, otherwise use fetched profile data
    const displayUser = isOwnProfile ? currentUser : profileUser;

    // Show loading state while fetching other user's profile
    if (!isOwnProfile && isLoadingProfile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <div className="text-center mb-6">
                        <Skeleton.Avatar active size={120} />
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </div>
                </Card>
            </div>
        );
    }

    // Show 404 if other user's profile not found
    if (!isOwnProfile && !profileUser) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Result
                    status="404"
                    title={t('errors.profileNotFound.title')}
                    subTitle={t('errors.profileNotFound.subtitle')}
                    extra={<Button type="primary" onClick={() => router.push('/')}>{t('errors.profileNotFound.button')}</Button>}
                />
            </div>
        );
    }

    const tabList = [
        {
            key: 'Trips',
            label: <div>
                <LuNotebookText className='inline mr-1' size={18} />
                <span className='mr-2 text-sm font-semibold'>{t('tabs.trips')}</span>
            </div>,
            children: <TripList userId={profileIdStr} isOwnProfile={isOwnProfile} />,
        },
        {
            key: 'Guides',
            label: <div>
                <LuCompass className='inline mr-1' size={18} /><span className='mr-2 text-sm font-semibold'>{t('tabs.guides')}</span>
            </div>,
            children: <GuideList userId={profileIdStr} isOwnProfile={isOwnProfile} />,
        },
    ];
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
                    <Tabs defaultActiveKey="Trips" items={tabList} />
                </div>
            </div>
        </div>
    );
};