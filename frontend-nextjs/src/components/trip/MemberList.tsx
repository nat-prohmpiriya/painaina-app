'use client'

import { useState } from 'react'
import {
  useTripMembers,
  useInviteTripMember,
  useRemoveTripMember,
  useUpdateMemberRole,
} from '@/hooks/useTripQueries'
import { Button, Avatar, Dropdown, Modal, Select } from 'antd'
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

  const getMenuItems = (member: any) => {
    if (currentUserRole !== 'admin') return []

    const items = [
      {
        key: 'admin',
        label: (
          <div className="flex items-center gap-2">
            <LuCrown className="w-4 h-4" />
            Make Admin
          </div>
        ),
        disabled: member.role === 'admin',
        onClick: () => handleUpdateRole(member.user_id, 'admin'),
      },
      {
        key: 'editor',
        label: (
          <div className="flex items-center gap-2">
            <LuPencil className="w-4 h-4" />
            Make Editor
          </div>
        ),
        disabled: member.role === 'editor',
        onClick: () => handleUpdateRole(member.user_id, 'editor'),
      },
      {
        key: 'viewer',
        label: (
          <div className="flex items-center gap-2">
            <LuEye className="w-4 h-4" />
            Make Viewer
          </div>
        ),
        disabled: member.role === 'viewer',
        onClick: () => handleUpdateRole(member.user_id, 'viewer'),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'remove',
        label: (
          <div className="flex items-center gap-2 text-red-600">
            <LuTrash2 className="w-4 h-4" />
            Remove Member
          </div>
        ),
        onClick: () => handleRemoveMember(member.user_id, member.user?.name || 'Unknown'),
      },
    ]

    return items
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
          <Button
            type="primary"
            icon={<LuUserPlus />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {members.map((member: any) => (
          <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar
                size={40}
                src={member.user?.image}
                className="bg-blue-500"
              >
                {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{member.user?.name || 'Unknown User'}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{member.user?.email}</p>
              </div>
            </div>

            {currentUserRole === 'admin' && (
              <Dropdown
                menu={{ items: getMenuItems(member) }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<LuEllipsis />}
                  className="text-gray-400 hover:text-gray-600"
                />
              </Dropdown>
            )}
          </div>
        ))}
      </div>

      {/* Invite Member Modal */}
      <Modal
        title="Invite Member"
        open={isInviteModalOpen}
        onCancel={() => setIsInviteModalOpen(false)}
        onOk={handleInviteMember}
        okText="Send Invite"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              className="w-full"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Viewer' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MemberList
