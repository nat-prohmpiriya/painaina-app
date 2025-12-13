'use client'

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthLoadingScreen from './AuthLoadingScreen';
import EmailVerificationBanner from './EmailVerificationBanner';

interface AuthWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  loadingMessage?: string;
}

const AuthWrapper = ({ 
  children, 
  requireAuth = false,
  requireEmailVerification = false,
  loadingMessage = "Loading your account..."
}: AuthWrapperProps) => {
  const { isLoading, isAuthenticated, user } = useAuth();
  // For now, assume email is always verified if user exists
  const isEmailVerified = user ? true : false;

  // Show loading screen while auth state is being determined
  if (isLoading) {
    return <AuthLoadingScreen message={loadingMessage} />;
  }

  // If auth is required but user is not authenticated, redirect to sign in
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  // If email verification is required but user's email is not verified
  if (requireEmailVerification && isAuthenticated && !isEmailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Email Verification Required</h2>
          <p className="text-gray-600 mb-4">
            Please verify your email address to access this feature.
          </p>
          <EmailVerificationBanner />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Show email verification banner for authenticated users with unverified emails */}
      {isAuthenticated && !isEmailVerified && <EmailVerificationBanner />}
      {children}
    </>
  );
};

export default AuthWrapper;