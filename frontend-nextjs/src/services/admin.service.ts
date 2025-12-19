import apiClient from './api-client'

// Types
export interface OverviewStats {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    bannedUsers: number
    totalTrips: number
    publicTrips: number
    privateTrips: number
    tripsCreatedThisMonth: number
    totalComments: number
    totalPhotos: number
    totalRevenue: number
    revenueThisMonth: number
}

export interface ChartDataPoint {
    label: string
    value: number
}

export interface User {
    id: string
    clerkId: string
    email: string
    name: string
    photoUrl?: string
    role: string
    isBanned: boolean
    bannedAt?: string
    bannedBy?: string
    banReason?: string
    createdAt: string
    updatedAt: string
}

export interface UserListResponse {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface Trip {
    id: string
    title: string
    description?: string
    type: 'trip' | 'guide'
    status: 'draft' | 'published' | 'archived'
    ownerId: string
    owner?: {
        id: string
        name: string
        photoUrl?: string
    }
    destinations: {
        name: string
        country: string
    }
    viewCount: number
    reactionsCount: number
    createdAt: string
    updatedAt: string
}

export interface TripListResponse {
    trips: Trip[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface Comment {
    id: string
    userId: string
    targetId: string
    targetType: 'trip' | 'place' | 'comment'
    content: string
    reactionsCount: number
    repliesCount: number
    createdAt: string
    user?: {
        id: string
        name: string
        email: string
        photoUrl?: string
    }
}

export interface CommentListResponse {
    comments: Comment[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface Place {
    id: string
    googlePlaceId: string
    name: string
    address: string
    rating?: number
    userRatingsTotal?: number
    categories?: string[]
    createdAt: string
    updatedAt: string
}

export interface PlaceCacheListResponse {
    places: Place[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface PlaceCacheStats {
    totalCached: number
    expiredCount: number
    validCount: number
    oldestCacheAge: string
    cacheSizeMB: number
}

export interface SystemHealth {
    database: 'healthy' | 'degraded' | 'down'
    redis: 'healthy' | 'degraded' | 'down'
    storage: 'healthy' | 'degraded' | 'down'
    apiStatus: 'healthy' | 'degraded' | 'down'
}

// Admin Service
class AdminService {
    // Stats
    async getOverviewStats(): Promise<OverviewStats> {
        return apiClient.get('/admin/stats/overview')
    }

    async getUserGrowthChart(months = 6): Promise<ChartDataPoint[]> {
        return apiClient.get('/admin/stats/user-growth', { months })
    }

    // Users
    async getUsers(params: {
        search?: string
        role?: string
        status?: string
        page?: number
        limit?: number
    } = {}): Promise<UserListResponse> {
        return apiClient.get('/admin/users', params)
    }

    async banUser(userId: string, reason: string, duration?: number): Promise<void> {
        return apiClient.put(`/admin/users/${userId}/ban`, { reason, duration })
    }

    async unbanUser(userId: string): Promise<void> {
        return apiClient.put(`/admin/users/${userId}/unban`)
    }

    // Trips
    async getTrips(params: {
        search?: string
        visibility?: string
        type?: string
        status?: string
        page?: number
        limit?: number
    } = {}): Promise<TripListResponse> {
        return apiClient.get('/admin/trips', params)
    }

    async deleteTrip(tripId: string): Promise<void> {
        return apiClient.delete(`/admin/trips/${tripId}`)
    }

    // Comments
    async getComments(params: {
        search?: string
        targetType?: string
        userId?: string
        page?: number
        limit?: number
    } = {}): Promise<CommentListResponse> {
        return apiClient.get('/admin/comments', params)
    }

    async deleteComment(commentId: string): Promise<void> {
        return apiClient.delete(`/admin/comments/${commentId}`)
    }

    // Places Cache
    async getCachedPlaces(params: {
        search?: string
        page?: number
        limit?: number
    } = {}): Promise<PlaceCacheListResponse> {
        return apiClient.get('/admin/places/cache', params)
    }

    async getCacheStats(): Promise<PlaceCacheStats> {
        return apiClient.get('/admin/places/cache/stats')
    }

    async clearExpiredCache(): Promise<{ message: string; deletedCount: number }> {
        return apiClient.post('/admin/places/cache/clear-expired')
    }

    async refreshPlaceCache(googlePlaceId: string): Promise<{ message: string; place: Place }> {
        return apiClient.post(`/admin/places/cache/${googlePlaceId}/refresh`)
    }

    async deleteCachedPlace(placeId: string): Promise<void> {
        return apiClient.delete(`/admin/places/cache/${placeId}`)
    }

    // System
    async getSystemHealth(): Promise<SystemHealth> {
        return apiClient.get('/admin/system/health')
    }
}

export const adminService = new AdminService()
export default adminService
