'use client'

import { useState } from 'react';
import { LuBookOpen, LuSparkles } from 'react-icons/lu';
import { useToastMessage } from '@/contexts/ToastMessageContext';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/TripContext';
import { useUpdateTrip } from '@/hooks/useTripQueries';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConvertToGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConvertToGuideModal = ({ isOpen, onClose }: ConvertToGuideModalProps) => {
  const [isConverting, setIsConverting] = useState(false);
  const { tripData } = useTripContext();
  const { showSuccess, showError } = useToastMessage();
  const router = useRouter();
  const updateTripMutation = useUpdateTrip();

  if (!tripData) return null;

  const tripTitle = tripData.title || 'Untitled Trip';

  const handleConvert = async () => {
    const tripId = tripData.id;
    if (!tripId) {
      showError('Trip ID is missing');
      return;
    }

    setIsConverting(true);
    try {
      await updateTripMutation.mutateAsync({
        tripId,
        data: { type: 'guide' }
      });
      showSuccess('Converted to Guide', 'Your trip is now a public guide that others can discover');
      onClose();
      // Redirect to the guide page
      router.push(`/guides/${tripId}`);
    } catch (error) {
      console.error('Convert to guide error:', error);
      showError('Failed to convert', 'Please try again or contact support if the problem persists');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <LuSparkles size={20} />
            <span>Convert to Guide</span>
          </DialogTitle>
          <DialogDescription>
            Share your trip experience with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trip Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="text-sm font-semibold mb-2 text-gray-800">
              Trip to convert:
            </h5>
            <div className="font-bold text-lg">
              {tripTitle}
            </div>
            {tripData.destination?.name && (
              <div className="text-sm text-gray-600 mt-1">
                {tripData.destination.name}
              </div>
            )}
          </div>

          {/* What happens */}
          <div>
            <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <LuBookOpen size={16} />
              What happens when you convert:
            </h5>
            <ul className="space-y-2 text-sm text-gray-700 ml-4">
              <li>• Your trip becomes a public travel guide</li>
              <li>• Other users can discover and view it</li>
              <li>• You can still edit the content anytime</li>
              <li>• All itinerary and places are preserved</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isConverting}
          >
            {isConverting ? (
              'Converting...'
            ) : (
              <>
                <LuSparkles className="mr-2 h-4 w-4" />
                Convert to Guide
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToGuideModal;
