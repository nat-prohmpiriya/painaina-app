'use client'

import { Suspense } from 'react';
import EmailVerificationPage from '@/components/auth/EmailVerificationPage';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';

export default function VerifyEmailErrorPage() {
  return (
    <Suspense fallback={<AuthLoadingScreen message="Loading error page..." />}>
      <EmailVerificationPage mode="error" />
    </Suspense>
  );
}