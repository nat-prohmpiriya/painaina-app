// Trip-related TypeScript interfaces and types

export type TripRole = 'admin' | 'editor' | 'viewer'
export type TripStatus = 'draft' | 'published' | 'archived'
export type TripLevel = 'Easy' | 'Moderate' | 'Hard' | 'Expert'
export type TripType = 'trip' | 'guide'

export interface TripDestination {
  place_id: string
  name: string
  formatted_address: string
  coordinates: {
    lat: number
    lng: number
  }
  types: string[]
  photos?: string[]
}

export interface TripMember {
  user_id: string
  role: TripRole
  joined_at: number
  invited_by?: string
}

export interface TripMemberWithUser extends TripMember {
  user: {
    _id: string
    name: string
    image?: string
    email: string
  } | null
}

export interface Trip {
  _id: string
  title: string
  description: string
  type: TripType
  start_date: number
  end_date: number
  photo_cover?: string
  destination: TripDestination
  like_total: number
  view_total: number
  tags: string[]
  level: TripLevel
  owner_id: string
  members?: TripMember[]
  created_at: number
  updated_at: number
  status: TripStatus
}

export interface TripWithOwner extends Trip {
  owner: {
    _id: string
    name: string
    image?: string
  } | null
}

export interface TripWithUserInfo extends Trip {
  userRole?: TripRole | null
  memberCount?: number
  owner?: {
    _id: string
    name: string
    image?: string
  } | null
}

export interface CreateTripRequest {
  title: string
  description: string
  type: TripType
  start_date: number
  end_date: number
  photo_cover?: string
  destination: TripDestination
  tags: string[]
  level: TripLevel
  status?: TripStatus
}

export interface UpdateTripRequest {
  tripId: string
  title?: string
  description?: string
  type?: TripType
  start_date?: number
  end_date?: number
  photo_cover?: string
  destination?: TripDestination
  tags?: string[]
  level?: TripLevel
  status?: TripStatus
}

export interface InviteMemberRequest {
  tripId: string
  userId: string
  role: TripRole
}

export interface UpdateMemberRoleRequest {
  tripId: string
  userId: string
  newRole: TripRole
}

export interface RemoveMemberRequest {
  tripId: string
  userId: string
}