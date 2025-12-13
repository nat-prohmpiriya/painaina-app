'use client'

import { Suspense } from 'react';
import EmailVerificationPage from '@/components/auth/EmailVerificationPage';
import AuthLoadingScreen from '@/components/auth/AuthLoadingScreen';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthLoadingScreen message="Loading verification page..." />}>
      <EmailVerificationPageContent />
    </Suspense>
  );
}

function EmailVerificationPageContent() {
  // You could check URL parameters here to determine the mode
  // For now, defaulting to 'verify' mode
  return <EmailVerificationPage mode="verify" />;
}