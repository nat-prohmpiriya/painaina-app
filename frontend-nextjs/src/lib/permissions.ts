// Permission helper functions for trip management

export type TripRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface TripPermissions {
  canEdit: boolean
  canDelete: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canUpdateRoles: boolean
  canView: boolean
}

/**
 * Get permissions based on user role
 */
export const getTripPermissions = (userRole?: TripRole | null): TripPermissions => {
  if (!userRole) {
    return {
      canEdit: false,
      canDelete: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canUpdateRoles: false,
      canView: false,
    }
  }

  switch (userRole) {
    case 'owner':
      return {
        canEdit: true,
        canDelete: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canUpdateRoles: true,
        canView: true,
      }

    case 'admin':
      return {
        canEdit: true,
        canDelete: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canUpdateRoles: true,
        canView: true,
      }

    case 'editor':
      return {
        canEdit: true,
        canDelete: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canUpdateRoles: false,
        canView: true,
      }

    case 'viewer':
      return {
        canEdit: false,
        canDelete: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canUpdateRoles: false,
        canView: true,
      }

    default:
      return {
        canEdit: false,
        canDelete: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canUpdateRoles: false,
        canView: false,
      }
  }
}

/**
 * Check if user can edit trip
 */
export const canEditTrip = (userRole?: TripRole | null): boolean => {
  return getTripPermissions(userRole).canEdit
}

/**
 * Check if user can delete trip
 */
export const canDeleteTrip = (userRole?: TripRole | null): boolean => {
  return getTripPermissions(userRole).canDelete
}

/**
 * Check if user can manage members (invite, remove, update roles)
 */
export const canManageMembers = (userRole?: TripRole | null): boolean => {
  return userRole === 'owner' || userRole === 'admin'
}

/**
 * Check if user can view trip
 */
export const canViewTrip = (userRole?: TripRole | null): boolean => {
  return getTripPermissions(userRole).canView
}

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: TripRole): string => {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'admin':
      return 'Admin'
    case 'editor':
      return 'Editor'
    case 'viewer':
      return 'Viewer'
    default:
      return 'Unknown'
  }
}

/**
 * Get role color class for UI
 */
export const getRoleColorClass = (role: TripRole): string => {
  switch (role) {
    case 'owner':
      return 'bg-yellow-100 text-yellow-700'
    case 'admin':
      return 'bg-purple-100 text-purple-700'
    case 'editor':
      return 'bg-blue-100 text-blue-700'
    case 'viewer':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/**
 * Check if role can perform action on target role
 */
export const canModifyRole = (userRole: TripRole, targetRole: TripRole): boolean => {
  // Only owners and admins can modify roles
  if (userRole !== 'owner' && userRole !== 'admin') return false

  // Owners can modify any role except other owners
  if (userRole === 'owner' && targetRole === 'owner') return false

  // Admins can modify any role except owners
  if (userRole === 'admin' && targetRole === 'owner') return false

  return true
}

/**
 * Get available roles that user can assign
 */
export const getAssignableRoles = (userRole?: TripRole | null): TripRole[] => {
  if (userRole === 'admin') {
    return ['admin', 'editor', 'viewer']
  }
  
  return []
}