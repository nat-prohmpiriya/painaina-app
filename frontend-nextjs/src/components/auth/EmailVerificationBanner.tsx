'use client'

import { Alert, Button, Space } from 'antd';
import { LuMail, LuRefreshCw } from 'react-icons/lu';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  // Simplified: assume email is verified if user exists
  const isEmailVerified = user ? true : false;
  
  // Mock resend function
  const resendEmailVerification = async () => {
    console.log('Email verification resend requested');
  };
  const [isResending, setIsResending] = useState(false);

  // Don't show banner if user is not logged in or email is already verified
  if (!user || isEmailVerified) {
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
      <Alert
        message={
          <div className="flex items-center justify-between">
            <Space>
              <LuMail size={16} />
              <span>
                Please verify your email address to access all features.
                {user.email && (
                  <span className="text-gray-600 ml-1">
                    We sent a verification link to <strong>{user.email}</strong>
                  </span>
                )}
              </span>
            </Space>
            <Button
              type="link"
              size="small"
              icon={<LuRefreshCw size={14} />}
              loading={isResending}
              onClick={handleResendVerification}
            >
              Resend Email
            </Button>
          </div>
        }
        type="warning"
        showIcon={false}
        closable
        className="border-orange-200 bg-orange-50"
      />
    </div>
  );
};

export default EmailVerificationBanner;