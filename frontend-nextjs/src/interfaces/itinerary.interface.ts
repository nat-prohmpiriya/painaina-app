import { Coordinates } from "./api-response.interface";

export type ItineraryEntryType = "place" | "note" | "todos";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface PlaceInfo {
  id?: string
  googlePlaceId?: string
  name?: string
  address?: string
  location?: {
    type: string
    coordinates: number[]
    latitude: number
    longitude: number
  }
  phone?: string
  website?: string
  rating?: number
  userRatingsTotal?: number
  priceLevel?: number
  editorialSummary?: {
    language?: string
    overview?: string
  } | null
  reviews?: GoogleReview[]
  categories?: string[]
  photos?: GooglePhoto[]
  openingHours?: any
  cachedAt?: string
  cacheExpiresAt?: string
}

export interface GoogleReview {
  authorName: string
  authorUrl: string
  language: string
  profilePhotoUrl: string
  rating: number
  relativeTimeDescription: string
  text: string
  time: number
}

export interface GooglePhoto {
  photoReference: string
  width: number
  height: number
  url: string
}



export interface UnsplashPhoto {
  url: string;
  thumbnail: string;
  photographer: string;
  description: string;
}

export interface ItineraryEntry {
  id: string;
  itineraryId: string;
  type: ItineraryEntryType;
  title: string;
  description?: string;
  placeId?: string;
  place?: PlaceInfo;
  duration?: number;
  budget?: number;
  photos?: string[];
  order: number;
  todos?: Todo[];
  createdAt: string;
  updatedAt: string;
  dayId?: string;
  notes?: string;
  coverPhoto?: string;
  startTime?: string;
  endTime?: string;
}

// Type guards and helper types
export type PlaceEntry = ItineraryEntry & { type: 'place'; place: PlaceInfo };
export type NoteEntry = ItineraryEntry & { type: 'note' };
export type TodoListEntry = ItineraryEntry & { type: 'todos'; todos: Todo[] };

export function isPlaceEntry(entry: ItineraryEntry): entry is PlaceEntry {
  return entry.type === 'place' && !!entry.place;
}

export function isNoteEntry(entry: ItineraryEntry): entry is NoteEntry {
  return entry.type === 'note';
}

export function isTodoListEntry(entry: ItineraryEntry): entry is TodoListEntry {
  return entry.type === 'todos';
}

export interface ItineraryDay {
  id: string;
  itineraryId: string;
  date: string;
  title: string;
  order: number;
  entries?: ItineraryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Itinerary {
  id: string;
  tripId: string;
  title?: string;
  days?: ItineraryDay[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateItineraryRequest {
  tripId: string;
  title?: string;
}

export interface UpdateItineraryRequest {
  title?: string;
}

export interface CreateEntryRequest {
  title: string;
  description?: string;
  type: ItineraryEntryType;
  startTime?: string;
  endTime?: string;
  place?: PlaceInfo;
  notes?: string;
  todos?: Omit<Todo, "id">[] | Todo[];
  unsplashPhotos?: UnsplashPhoto[];
  order: number;
}

export interface UpdateEntryRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface UpdateTodosRequest {
  todos: Todo[];
}

export interface CreateTodoRequest {
  title: string;
  order: number;
}

export interface UpdateTodoRequest {
  title?: string;
}

export interface ReorderTodosRequest {
  todoIds: string[];
}

export interface AddDayRequest {
  date: string;
  title: string;
  order: number;
}
