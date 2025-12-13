'use client'

import { useState } from 'react';
import { Modal, Button, Alert, Space, Typography, Input } from 'antd';
import { LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { tripService } from '@/services';
import { useToastMessage } from '@/contexts/ToastMessageContext';
import { useRouter } from 'next/navigation';
import { useTripContext } from '@/contexts/TripContext';

const { Text, Title } = Typography;

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
    <Modal
      title={
        <div className="flex items-center space-x-2 text-red-600">
          <LuTriangleAlert size={20} />
          <span>Delete Trip</span>
        </div>
      }
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      centered
    >
      <div className="space-y-6">
        {/* Warning Message */}
        <Alert
          message="This action cannot be undone!"
          description="Deleting this trip will permanently remove all associated data including itinerary, expenses, photos, and member information."
          type="error"
          showIcon
          icon={<LuTriangleAlert />}
        />

        {/* Trip Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Title level={5} className="mb-2 text-gray-800">
            Trip to be deleted:
          </Title>
          <Text strong className="text-lg">
            {tripTitle}
          </Text>
          <div className="mt-2 text-sm text-gray-600">
            <div>Destination: {tripData.destination?.name}</div>
            <div>Members: {members?.length || 0}</div>
            <div>Created: {tripData.createdAt ? new Date(tripData.createdAt).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>

        {/* What will be deleted */}
        <div>
          <Title level={5} className="text-red-600 mb-3">
            The following data will be permanently deleted:
          </Title>
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
        <div>
          <Title level={5} className="mb-2">
            Type <Text code>{tripTitle}</Text> to confirm deletion:
          </Title>
          <Input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={`Type "${tripTitle}" here`}
            size="large"
            className={`${
              confirmationText && !isConfirmationValid
                ? 'border-red-300 focus:border-red-500'
                : ''
            }`}
          />
          {confirmationText && !isConfirmationValid && (
            <Text type="danger" className="text-sm mt-1 block">
              Trip name doesn't match. Please type exactly: {tripTitle}
            </Text>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            onClick={handleCancel}
            disabled={isDeleting}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            danger
            icon={<LuTrash2 />}
            onClick={handleDelete}
            loading={isDeleting}
            disabled={!isConfirmationValid}
            size="large"
          >
            Delete Trip Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteTripModal;
