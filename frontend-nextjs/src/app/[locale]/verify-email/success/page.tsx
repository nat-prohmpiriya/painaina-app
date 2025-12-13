'use client'

import { Suspense } from 'react';
import EmailVerificationPage from '@/components/auth/EmailVerificationPage';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';

export default function VerifyEmailSuccessPage() {
  return (
    <Suspense fallback={<AuthLoadingScreen message="Loading success page..." />}>
      <EmailVerificationPage mode="success" />
    </Suspense>
  );
}