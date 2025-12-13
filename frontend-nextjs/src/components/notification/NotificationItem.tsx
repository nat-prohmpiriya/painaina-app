'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import { Notification } from '@/services/notification.service'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
}

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'trip_invite':
        return '✈️'
      case 'comment':
        return '💬'
      case 'member_joined':
        return '👋'
      case 'like':
        return '❤️'
      default:
        return '🔔'
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: enUS,
  })

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notification.sender?.profileImageUrl} alt="" />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 text-sm">{getNotificationIcon()}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
      </div>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </div>
  )
}
