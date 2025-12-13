'use client'

import React, { useState } from 'react'
import { Badge, Popover } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useUnreadCount } from '@/hooks/useNotifications'
import NotificationDropdown from './NotificationDropdown'

export default function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadCount()
  const [open, setOpen] = useState(false)

  return (
    <Popover
      content={<NotificationDropdown onClose={() => setOpen(false)} />}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      className="notification-popover"
      style={{ paddingTop: '8px' }}
    >
      <div className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
        <Badge count={unreadCount} size="small" offset={[0, 4]}>
          <BellOutlined className="text-xl text-gray-700" />
        </Badge>
      </div>
    </Popover>
  )
}
