'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '@/hooks/useNotifications'
import NotificationItem from './NotificationItem'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface NotificationDropdownProps {
  onClose: () => void
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter()
  const { data, isLoading } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const notifications = data?.notifications || []

  const handleNotificationClick = (notificationId: string, referenceId: string, type: string) => {
    markAsRead.mutate(notificationId)
    onClose()

    // Navigate based on notification type
    if (type === 'trip_invite' || type === 'member_joined') {
      router.push(`/trips/${referenceId}`)
    } else if (type === 'comment') {
      // Navigate to trip with comment - you may need to adjust this
      router.push(`/trips/${referenceId}`)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  return (
    <div className="w-[380px] max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto"
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8">
            <Empty description="No notifications" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() =>
                  handleNotificationClick(
                    notification.id,
                    notification.referenceId,
                    notification.type
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="border-t border-gray-200 p-3 text-center">
          <Button
            variant="link"
            onClick={() => {
              onClose()
              router.push('/notifications')
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            View all
          </Button>
        </div>
      )}
    </div>
  )
}
