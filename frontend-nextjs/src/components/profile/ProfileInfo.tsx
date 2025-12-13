'use client'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CircleUserRound, Share, Mail, MessageSquare } from "lucide-react"
import EditProfileModal from "./EditProfileModal"
import { useTranslations } from 'next-intl'

interface ProfileInfoProps {
    user: any;
    isOwnProfile: boolean;
}

const ProfileInfo = ({ user, isOwnProfile }: ProfileInfoProps) => {
    const t = useTranslations('profile.info');

    if (!user) {
        return (
            <div className="w-full border border-gray-100 rounded-lg p-4 gap-4">
                <div className="flex flex-col items-center mt-10">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarFallback>{t('loading')}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full border border-gray-100 rounded-lg p-4 gap-4">
            <div className="flex flex-col items-center mt-6 md:mt-10">
                <img
                    className="rounded-full h-32 w-32 md:h-48 md:w-48 lg:h-64 lg:w-64 object-cover"
                    width={100}
                    height={100}
                    src={user?.photoUrl}
                    alt="Profile"
                />
            </div>
            <div className="my-6 md:my-12 text-left">
                <p className="mt-3 md:mt-4 flex items-center gap-3 md:gap-4">
                    <CircleUserRound className="text-lg md:text-xl flex-shrink-0" />
                    <span className="font-semibold text-sm md:text-base break-all">
                        {user?.name || t('notProvided')}
                    </span>
                </p>
                <p className="mt-3 md:mt-4 flex items-center gap-3 md:gap-4">
                    <Mail className="text-lg md:text-xl flex-shrink-0" />
                    <span className="font-semibold text-sm md:text-base break-all">
                        {user?.email || t('notProvided')}
                    </span>
                </p>
                <p className="mt-3 md:mt-4 flex items-center gap-3 md:gap-4 cursor-pointer">
                    <MessageSquare className="text-lg md:text-xl flex-shrink-0" />
                    <span className="font-semibold text-sm md:text-base">{t('message')}</span>
                </p>
            </div>
            <div className="flex justify-center items-center gap-6 md:gap-8 mt-4 mb-6 md:mb-8">
                <div className="flex flex-col justify-center items-center gap-2 md:gap-4">
                    <span className="text-gray-400 text-lg md:text-2xl font-bold">{t('followers')}</span>
                    <span className="font-semibold text-gray-600 text-xs md:text-sm">0</span>
                </div>
                <div className="flex flex-col justify-center items-center gap-2 md:gap-4">
                    <span className="text-gray-400 text-lg md:text-2xl font-bold">{t('following')}</span>
                    <span className="font-semibold text-gray-600 text-xs md:text-sm">0</span>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                {isOwnProfile && <EditProfileModal />}
                <Button variant="outline" className="w-full rounded-full">
                    <Share className="mr-2 h-4 w-4" />
                    {t('share')}
                </Button>
            </div>
        </div>
    )
}

export default ProfileInfo