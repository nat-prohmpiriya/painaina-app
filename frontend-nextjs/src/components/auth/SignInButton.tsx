'use client'

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LuUser, LuLogOut } from 'react-icons/lu';
import { SignInButton as ClerkSignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';


const SignInButton = () => {
    const { signOut, isAuthenticated, user: convexUser } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <>
            {isAuthenticated ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarImage src={convexUser?.photoUrl} alt="" />
                            <AvatarFallback>
                                {convexUser?.name?.charAt(0).toUpperCase() || <LuUser />}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/profiles/${convexUser?.id}`)}>
                            <LuUser className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                            <LuLogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <ClerkSignInButton mode="modal">
                    <Button className="rounded-full h-9 w-9 md:w-auto md:px-4" aria-label="Sign In">
                        <LuUser className="h-5 w-5 md:mr-2 md:h-4 md:w-4" />
                        <span className='hidden md:inline font-semibold'>Sign In</span>
                    </Button>
                </ClerkSignInButton>
            )}
        </>
    );
};

export default SignInButton;
