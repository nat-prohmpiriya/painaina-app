'use client'

import { Button, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { LuUser, LuLogOut } from 'react-icons/lu';
import { SignInButton as ClerkSignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LuBell } from "react-icons/lu";
import { useAuth } from '@/hooks/useAuth';


const SignInButton = () => {
    const { signOut, isAuthenticated, user: convexUser } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
    };

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: 'Profile',
            icon: <LuUser size={16} />,
            onClick: () => router.push(`/profiles/${convexUser?.id}`)
        },
        {
            key: '2',
            label: 'Sign Out',
            icon: <LuLogOut size={16} />,
            onClick: handleSignOut
        },
    ];

    return (
        <>
            {isAuthenticated ? (
                <>
                    <Dropdown menu={{ items }} placement="bottomRight" arrow>
                        <Avatar
                            src={convexUser?.photoUrl}
                            // icon={!convexUser?.image ? <LuUser /> : undefined}
                            style={{ cursor: 'pointer' }}
                            size="default"
                        >
                            {!convexUser?.photoUrl && convexUser?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Dropdown>
                </>
            ) : (
                <ClerkSignInButton mode="modal">
                    <Button
                        shape='round'
                        type="primary"
                        icon={<LuUser />}
                    >
                        <span className='font-semibold'>Sign In</span>
                    </Button>
                </ClerkSignInButton>
            )}
        </>
    );
};

export default SignInButton;