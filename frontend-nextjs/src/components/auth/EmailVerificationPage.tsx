'use client'

import { Mail, Check, RefreshCw, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface EmailVerificationPageProps {
  mode: 'verify' | 'success' | 'error';
}

const EmailVerificationPage = ({ mode }: EmailVerificationPageProps) => {
  const { user } = useAuth();

  // Mock resend function
  const resendEmailVerification = async () => {
    console.log('Email verification resend requested');
  };
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get verification token from URL
  const token = searchParams.get('token');

  useEffect(() => {
    // If we have a token and we're in verify mode, attempt verification
    if (token && mode === 'verify') {
      // This would need to be implemented in the backend
      // verifyEmailToken(token);
    }
  }, [token, mode]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await resendEmailVerification();
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Email Verified Successfully!
              </h1>
              <p className="text-muted-foreground">
                Your email has been verified. You can now access all features.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/')}
                size="lg"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/profiles/${user?.id}`)}
                size="lg"
              >
                View Profile
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Email Verification Failed
              </h1>
              <p className="text-muted-foreground">
                The verification link is invalid or has expired. Please request a new verification email.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                size="lg"
              >
                <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                Resend Verification Email
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                size="lg"
              >
                Go to Home
              </Button>
            </div>
          </div>
        );

      default: // verify mode
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Check Your Email
              </h1>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  We've sent a verification link to{' '}
                  {user?.email && <strong className="text-foreground">{user.email}</strong>}
                </p>
                <p>
                  Click the link in the email to verify your account.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                size="lg"
              >
                <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                Resend Email
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                size="lg"
              >
                Continue to Home
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
