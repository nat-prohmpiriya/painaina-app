export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
}

export interface ListResponse<T> {
  trips: T[];
  meta: PaginationMeta;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  name: string;
  country: string;
  address?: string;
  formattedAddress?: string;
  formatted_address?: string; // Alias (backward compatibility)
  placeId?: string;
  place_id?: string; // Alias (backward compatibility)
  coordinates: Coordinates;
  location?: Coordinates; // Alias (backward compatibility)
  types?: string[];
  photos?: string[];
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface DateRange {
  start_date: number;
  end_date: number;
}
