'use client'

import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { useRouter } from "next/navigation";
import { useToastMessage } from '@/contexts/ToastMessageContext';
import { useCurrentUser, useUpdateCurrentUser } from './useUserQueries';
import type { User } from '@/interfaces';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
}

export interface AuthActions {
  signIn: (provider?: string, params?: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; image?: string }) => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const useAuth = (): AuthState & AuthActions => {
  const { signOut: clerkSignOut, isSignedIn, isLoaded } = useClerkAuth();
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToastMessage();

  // Use React Query for user data
  const {
    data: user = null,
    isLoading,
    isError,
    refetch: refetchUser,
  } = useCurrentUser(isLoaded && isSignedIn);

  const updateProfileMutation = useUpdateCurrentUser();

  // Auth actions
  const signIn = async (provider?: string, params?: any) => {
    try {
      router.push('/sign-in');
      showSuccess('Redirecting to sign in...');
    } catch (error) {
      console.error('Sign in error:', error);
      showError('Sign in failed');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      showInfo('Signed out successfully');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      showError('Failed to sign out');
      throw error;
    }
  };

  const updateProfile = async (data: { name?: string; image?: string }) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      showError('Failed to update profile');
      throw error;
    }
  };

  return {
    // State
    user,
    isAuthenticated: isSignedIn || false,
    isLoading,
    isError,

    // Actions
    signIn,
    signOut,
    updateProfile,
    refetchUser: async () => {
      await refetchUser();
    },
  };
};
