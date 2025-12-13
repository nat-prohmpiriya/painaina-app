'use client'

import { Result, Button, Card } from 'antd';
import { LuMail, LuCheck, LuRefreshCw, LuHouse } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
          <Result
            icon={<LuCheck className="text-green-500" size={64} />}
            title="Email Verified Successfully!"
            subTitle="Your email has been verified. You can now access all features."
            extra={[
              <Button
                key="home"
                type="primary"
                icon={<LuHouse />}
                onClick={() => router.push('/')}
              >
                Go to Home
              </Button>,
              <Button
                key="profile"
                onClick={() => router.push(`/profiles/${user?.id}`)}
              >
                View Profile
              </Button>
            ]}
          />
        );

      case 'error':
        return (
          <Result
            status="error"
            title="Email Verification Failed"
            subTitle="The verification link is invalid or has expired. Please request a new verification email."
            extra={[
              <Button
                key="resend"
                type="primary"
                icon={<LuRefreshCw />}
                loading={isResending}
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </Button>,
              <Button
                key="home"
                onClick={() => router.push('/')}
              >
                Go to Home
              </Button>
            ]}
          />
        );

      default: // verify mode
        return (
          <Result
            icon={<LuMail className="text-blue-500" size={64} />}
            title="Check Your Email"
            subTitle={
              <div className="space-y-2">
                <p>
                  We've sent a verification link to{' '}
                  {user?.email && <strong>{user.email}</strong>}
                </p>
                <p className="text-gray-600">
                  Click the link in the email to verify your account.
                </p>
              </div>
            }
            extra={[
              <Button
                key="resend"
                type="primary"
                icon={<LuRefreshCw />}
                loading={isResending}
                onClick={handleResendVerification}
              >
                Resend Email
              </Button>,
              <Button
                key="home"
                onClick={() => router.push('/')}
              >
                Continue to Home
              </Button>
            ]}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {renderContent()}
      </Card>
    </div>
  );
};

export default EmailVerificationPage;