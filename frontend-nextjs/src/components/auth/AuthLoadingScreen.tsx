'use client'

import { Spin, Card } from 'antd';
import { LuLoader } from 'react-icons/lu';

interface AuthLoadingScreenProps {
  message?: string;
}

const AuthLoadingScreen = ({ message = "Loading..." }: AuthLoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="text-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <Spin
            indicator={
              <LuLoader 
                className="animate-spin text-blue-500" 
                size={48} 
              />
            }
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {message}
            </h3>
            <p className="text-gray-600 text-sm">
              Please wait while we load your account...
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthLoadingScreen;