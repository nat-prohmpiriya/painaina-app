import { Location } from "./api-response.interface";
import { PlaceInfo } from "./itinerary.interface";

export type TripType = "trip" | "guide";
export type TripStatus = "draft" | "published" | "archived";
export type TripLevel = "Easy" | "Moderate" | "Hard" | "Expert";

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: Location;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  type: TripType;
  status: TripStatus;
  level: TripLevel;
  tags: string[];
  ownerId: string;
  viewCount?: number;
  reactionsCount?: number;
  budget?: {
    amount: number;
    currency: string;
  };
  tripMembers?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripRequest {
  title: string;
  description: string;
  destination: Location;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  type?: TripType;
  status?: TripStatus;
  level: TripLevel;
  tags: string[];
}

export interface UpdateTripRequest {
  title?: string;
  description?: string;
  destination?: Location;
  startDate?: string;
  endDate?: string;
  coverPhoto?: string;
  type?: TripType;
  status?: TripStatus;
  level?: TripLevel;
  tags?: string[];
  budgetTotal?: number;
  budgetCurrency?: string;
}

export interface ListTripsQuery {
  limit?: number;
  offset?: number;
  type?: TripType;
  status?: TripStatus;
  level?: TripLevel;
  ownerId?: string;
  memberId?: string;
  tag?: string;
}

export interface SetBudgetRequest {
  amount: number;
  currency: string;
}

export interface TripMember {
  userId: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
}

export interface InviteMemberRequest {
  userId: string;
  role: "owner" | "admin" | "editor" | "viewer";
}

// User info from aggregated response
export interface TripUserInfo {
  id: string;
  name: string;
  photoUrl?: string;
}

// Member with user data from aggregated response
export interface TripMemberWithUser {
  userId: string;
  role: string;
  joinedAt: string;
  user: TripUserInfo;
}

// Itinerary with entries from aggregated response
export interface ItineraryWithEntries {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  title: string;
  order: number;
  entries: ItineraryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type EntryType = "place" | "note" | "todos";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface ItineraryEntry {
  id: string;
  itineraryId: string;
  type: EntryType;
  title: string;
  description?: string;
  placeId?: string;
  place?: PlaceInfo;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  budget?: number;
  photos?: string[];
  order: number;
  todos?: Todo[];
  createdAt: string;
  updatedAt: string;
}

// Full trip detail response with all aggregated data
export interface TripDetailResponse {
  id: string;
  title: string;
  description: string;
  destinations: {
    name: string;
    country: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    placeId?: string;
  };
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  type: TripType;
  status: TripStatus;
  level?: TripLevel;
  tags: string[];
  ownerId: string;
  budgetTotal?: number;
  budgetCurrency?: string;
  viewCount?: number;
  reactionsCount?: number;
  bookmarkCount?: number;
  shareCount?: number;
  createdAt: string;
  updatedAt: string;

  // Aggregated data
  owner: TripUserInfo;
  tripMembers: TripMemberWithUser[];
  itineraries: ItineraryWithEntries[];
  expenses: any[]; // Will use Expense type
}
