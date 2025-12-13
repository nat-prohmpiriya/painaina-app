'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LuTrash2 } from 'react-icons/lu';
import { canDeleteTrip } from '@/lib/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useTripContext } from '@/contexts/TripContext';
import DeleteTripModal from './DeleteTripModal';

interface DeleteTripButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'link';
}

const DeleteTripButton = ({
  className = '',
  size = 'default',
  variant = 'default'
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant === 'default' ? 'destructive' : variant}
              size={size}
              onClick={() => setIsDeleteModalOpen(true)}
              className={className}
            >
              <LuTrash2 className="mr-2" />
              Delete Trip
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete this trip permanently</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DeleteTripModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
};

export default DeleteTripButton;