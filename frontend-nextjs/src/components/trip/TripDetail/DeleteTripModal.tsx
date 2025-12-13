'use client'

import { useState } from 'react';
import { LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { tripService } from '@/services';
import { useToastMessage } from '@/contexts/ToastMessageContext';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/TripContext';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeleteTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteTripModal = ({ isOpen, onClose }: DeleteTripModalProps) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { tripData, members } = useTripContext();
  const { showSuccess, showError } = useToastMessage();
  const router = useRouter();

  if (!tripData) return null;

  const tripTitle = tripData.title || 'Untitled Trip';
  const isConfirmationValid = confirmationText === tripTitle;

  const handleDelete = async () => {
    if (!isConfirmationValid) return;

    const tripId = tripData.id || tripData.id;
    if (!tripId) {
      showError('Trip ID is missing');
      return;
    }

    setIsDeleting(true);
    try {
      await tripService.deleteTrip(tripId);
      showSuccess('Trip deleted successfully', 'The trip and all its data have been permanently removed');
      onClose();
      router.push('/trips'); // Redirect to trips list
    } catch (error) {
      console.error('Delete trip error:', error);
      showError('Failed to delete trip', 'Please try again or contact support if the problem persists');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <LuTriangleAlert size={20} />
            <span>Delete Trip</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Message */}
          <Alert variant="destructive">
            <LuTriangleAlert className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">This action cannot be undone!</div>
              <div className="text-sm">
                Deleting this trip will permanently remove all associated data including itinerary,
                expenses, photos, and member information.
              </div>
            </AlertDescription>
          </Alert>

          {/* Trip Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="text-sm font-semibold mb-2 text-gray-800">
              Trip to be deleted:
            </h5>
            <div className="font-bold text-lg mb-2">
              {tripTitle}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Destination: {tripData.destination?.name}</div>
              <div>Members: {members?.length || 0}</div>
              <div>Created: {tripData.createdAt ? new Date(tripData.createdAt).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          {/* What will be deleted */}
          <div>
            <h5 className="text-sm font-semibold text-red-600 mb-3">
              The following data will be permanently deleted:
            </h5>
            <ul className="space-y-1 text-sm text-gray-700 ml-4">
              <li>• All itinerary entries and schedules</li>
              <li>• All expenses and financial records</li>
              <li>• All uploaded photos and documents</li>
              <li>• All member access and roles</li>
              <li>• All todos and notes</li>
              <li>• Trip settings and preferences</li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label>
              Type <code className="bg-gray-100 px-2 py-1 rounded text-sm">{tripTitle}</code> to confirm deletion:
            </Label>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${tripTitle}" here`}
              className={
                confirmationText && !isConfirmationValid
                  ? 'border-red-300 focus:border-red-500'
                  : ''
              }
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-red-500">
                Trip name doesn't match. Please type exactly: {tripTitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting ? (
              'Deleting...'
            ) : (
              <>
                <LuTrash2 className="mr-2 h-4 w-4" />
                Delete Trip Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTripModal;
