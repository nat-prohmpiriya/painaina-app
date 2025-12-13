// Google Places API Type Definitions (Customer Web)

export interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

export interface PlaceGeometry {
  location: {
    lat: number;
    lng: number;
  };
}

export interface PlaceOpeningHours {
  open_now: boolean;
  weekday_text?: string[];
}

export interface PlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
}

export interface PlaceEditorialSummary {
  language: string;
  overview: string;
}

export interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  geometry: PlaceGeometry;
  types: string[];
  photos?: PlacePhoto[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: PlaceOpeningHours;
  reviews?: PlaceReview[];
  editorial_summary?: PlaceEditorialSummary;
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
}