'use client'

import { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { LuTrash2 } from 'react-icons/lu';
import { canDeleteTrip } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useTripContext } from '@/contexts/TripContext';
import DeleteTripModal from './DeleteTripModal';

interface DeleteTripButtonProps {
  className?: string;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'text' | 'link';
}

const DeleteTripButton = ({
  className = '',
  size = 'middle',
  type = 'default'
}: DeleteTripButtonProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();
  const { tripData, members } = useTripContext();

  if (!tripData || !user) return null;

  // Get user's role in this trip
  const userMember = members?.find(
    member => member.userId === user?.id
  );
  const userRole = userMember?.role as 'admin' | 'editor' | 'viewer' | undefined;
  const canDelete = canDeleteTrip(userRole);

  // Don't render button if user can't delete
  if (!canDelete) return null;

  return (
    <>
      <Tooltip title="Delete this trip permanently">
        <Button
          type={type}
          danger
          icon={<LuTrash2 />}
          onClick={() => setIsDeleteModalOpen(true)}
          className={className}
          size={size}
        >
          Delete Trip
        </Button>
      </Tooltip>

      <DeleteTripModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};

export default DeleteTripButton;