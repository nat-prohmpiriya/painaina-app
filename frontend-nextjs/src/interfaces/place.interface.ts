import { Coordinates } from "./api-response.interface";

export interface PlacePhoto {
  photoReference: string;
  width: number;
  height: number;
  attributions?: string[];
}

export interface PlaceReview {
  authorName: string;
  authorUrl?: string;
  language?: string;
  profilePhotoUrl?: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
  time: number;
}

export interface EditorialSummary {
  overview: string;
  language?: string;
}

export interface PlaceOpeningHours {
  openNow: boolean;
  periods?: Array<{
    open: { day: number; time: string };
    close?: { day: number; time: string };
  }>;
  weekdayText?: string[];
}

export interface Place {
  _id: string;
  placeId: string;
  name: string;
  formattedAddress: string;
  formatted_address?: string; // Alias (backward compatibility)
  location: Coordinates;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  editorialSummary?: EditorialSummary;
  reviews?: PlaceReview[];
  photos?: PlacePhoto[];
  openingHours?: PlaceOpeningHours;
  website?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutocompleteResult {
  placeId: string;
  description: string;
  name: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  location?: Coordinates;
  source?: string; // "in-memory" or "google"
  structuredFormatting?: {
    mainText: string;
    secondaryText: string;
  };
}

export interface PlaceOption {
  value: string;
  label: React.ReactNode;
  place: {
    placeId: string;
    name: string;
    formattedAddress: string;
    coordinates: Coordinates;
    types: string[];
    photos?: string[];
    coverPhoto?: string;
    source?: string;
  };
}

export interface AutocompleteResponse {
  predictions: AutocompleteResult[];
  status: string;
}

export interface SearchPlacesQuery {
  query: string;
  location?: Coordinates;
  radius?: number;
  type?: string;
}

export interface GetPlacePhotosQuery {
  placeId: string;
  maxWidth?: number;
  maxHeight?: number;
}

export interface GetPlaceReviewsQuery {
  placeId: string;
}
