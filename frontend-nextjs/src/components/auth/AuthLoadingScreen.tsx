'use client'

import { Loader2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface AuthLoadingScreenProps {
  message?: string;
}

const AuthLoadingScreen = ({ message = "Loading..." }: AuthLoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="xl" className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {message}
            </h3>
            <p className="text-muted-foreground text-sm">
              Please wait while we load your account...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
