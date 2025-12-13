import apiClient from './api-client'

export interface Notification {
  id: string
  recipientId: string
  senderId: string
  type: 'trip_invite' | 'comment' | 'member_joined' | 'like'
  referenceId: string
  message: string
  isRead: boolean
  createdAt: string
  updatedAt: string
  sender?: {
    id: string
    clerkId: string
    email: string
    username?: string
    firstName?: string
    lastName?: string
    profileImageUrl?: string
  }
}

export interface GetNotificationsResponse {
  notifications: Notification[]
  limit: number
  offset: number
}

export interface UnreadCountResponse {
  count: number
}

export class NotificationService {
  private basePath = '/notifications'

  async getNotifications(limit = 20, offset = 0): Promise<GetNotificationsResponse> {
    return apiClient.get<GetNotificationsResponse>(this.basePath, {
      params: { limit, offset },
    })
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>(`${this.basePath}/unread-count`)
    return response.count
  }

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put<void>(`${this.basePath}/${notificationId}/read`)
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.put<void>(`${this.basePath}/read-all`)
  }
}

export const notificationService = new NotificationService()
