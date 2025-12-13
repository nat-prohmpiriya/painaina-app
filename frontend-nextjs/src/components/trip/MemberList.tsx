'use client'

import { useState } from 'react'
import {
  useTripMembers,
  useInviteTripMember,
  useRemoveTripMember,
  useUpdateMemberRole,
} from '@/hooks/useTripQueries'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LuEllipsis, LuUserPlus, LuCrown, LuPencil, LuEye, LuTrash2 } from 'react-icons/lu'
import { useToastMessage } from '@/contexts/ToastMessageContext'

interface MemberListProps {
  tripId: string
  currentUserRole?: string
}

const MemberList = ({ tripId, currentUserRole }: MemberListProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('viewer')
  const { showSuccess, showError } = useToastMessage()

  // Use React Query hooks
  const { data: members = [], isLoading: loading } = useTripMembers(tripId)
  const inviteMemberMutation = useInviteTripMember()
  const removeMemberMutation = useRemoveTripMember()
  const updateRoleMutation = useUpdateMemberRole()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-purple-700 bg-purple-100'
      case 'editor':
        return 'text-blue-700 bg-blue-100'
      case 'viewer':
        return 'text-gray-700 bg-gray-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <LuCrown className="w-4 h-4" />
      case 'editor':
        return <LuPencil className="w-4 h-4 text-blue-700" />
      case 'viewer':
        return <LuEye className="w-4 h-4" />
      default:
        return null
    }
  }

  const handleInviteMember = async () => {
    if (!selectedUserId || !selectedRole) {
      showError('Please select a user and role')
      return
    }

    try {
      await inviteMemberMutation.mutateAsync({
        tripId,
        data: {
          userId: selectedUserId,
          role: selectedRole,
        },
      })
      showSuccess('Member invited successfully!')
      setIsInviteModalOpen(false)
      setSelectedUserId('')
      setSelectedRole('viewer')
    } catch (error) {
      showError('Failed to invite member')
      console.error('Invite member error:', error)
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to remove ${userName} from this trip?`)) {
      try {
        await removeMemberMutation.mutateAsync({ tripId, userId })
        showSuccess('Member removed successfully!')
      } catch (error) {
        showError('Failed to remove member')
        console.error('Remove member error:', error)
      }
    }
  }

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      await updateRoleMutation.mutateAsync({ tripId, userId, role: newRole })
      showSuccess('Member role updated successfully!')
    } catch (error) {
      showError('Failed to update member role')
      console.error('Update role error:', error)
    }
  }


  if (loading) {
    return <div>Loading members...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Members</h3>
          <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>

        {currentUserRole === 'admin' && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <LuUserPlus className="mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {members.map((member: any) => (
          <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.user?.image} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{member.user?.name || 'Unknown User'}</p>
                  <Badge variant="secondary" className={`inline-flex items-center gap-1 ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{member.user?.email}</p>
              </div>
            </div>

            {currentUserRole === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <LuEllipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={member.role === 'admin'}
                    onClick={() => handleUpdateRole(member.user_id, 'admin')}
                  >
                    <LuCrown className="mr-2 w-4 h-4" />
                    Make Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={member.role === 'editor'}
                    onClick={() => handleUpdateRole(member.user_id, 'editor')}
                  >
                    <LuPencil className="mr-2 w-4 h-4" />
                    Make Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={member.role === 'viewer'}
                    onClick={() => handleUpdateRole(member.user_id, 'viewer')}
                  >
                    <LuEye className="mr-2 w-4 h-4" />
                    Make Viewer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => handleRemoveMember(member.user_id, member.user?.name || 'Unknown')}
                  >
                    <LuTrash2 className="mr-2 w-4 h-4" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      {/* Invite Member Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Add a new member to this trip by entering their user ID and selecting their role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'admin' | 'editor' | 'viewer')}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MemberList
