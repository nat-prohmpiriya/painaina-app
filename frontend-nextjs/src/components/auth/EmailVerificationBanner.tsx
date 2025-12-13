'use client'

import { Mail, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);

  // Simplified: assume email is verified if user exists
  const isEmailVerified = user ? true : false;

  // Mock resend function
  const resendEmailVerification = async () => {
    console.log('Email verification resend requested');
  };

  // Don't show banner if user is not logged in or email is already verified
  if (!user || isEmailVerified || !isVisible) {
    return null;
  }

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

  return (
    <div className="mb-4">
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
        <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-sm text-orange-900 dark:text-orange-100">
                Please verify your email address to access all features.
                {user.email && (
                  <span className="text-orange-700 dark:text-orange-300 ml-1">
                    We sent a verification link to <strong>{user.email}</strong>
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isResending}
                onClick={handleResendVerification}
                className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 dark:text-orange-300 dark:hover:text-orange-100 dark:hover:bg-orange-900/50"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isResending ? 'animate-spin' : ''}`} />
                Resend Email
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsVisible(false)}
                className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 dark:text-orange-300 dark:hover:text-orange-100 dark:hover:bg-orange-900/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmailVerificationBanner;
