import apiClient from "./api-client";
import type {
  Place,
  AutocompleteResult,
  AutocompleteResponse,
  SearchPlacesQuery,
  GetPlacePhotosQuery,
  GetPlaceReviewsQuery,
  PlacePhoto,
  PlaceReview,
} from "@/interfaces";

export class PlaceService {
  private basePath = "/places";

  /**
   * Generate a unique session token for Google Places API billing optimization
   * Use the same token for autocomplete + getPlace calls to group them as one billing session
   */
  generateSessionToken(): string {
    return crypto.randomUUID();
  }

  async autocomplete(input: string, sessionToken?: string): Promise<AutocompleteResult[]> {
    const params: Record<string, string> = { input };
    if (sessionToken) params.sessionToken = sessionToken;
    const response = await apiClient.get<AutocompleteResponse>(`${this.basePath}/autocomplete`, params);
    return response.predictions || [];
  }

  async autocompleteCity(input: string, sessionToken?: string): Promise<AutocompleteResponse> {
    const params: Record<string, string> = { input };
    if (sessionToken) params.sessionToken = sessionToken;
    return apiClient.get<AutocompleteResponse>(`${this.basePath}/autocomplete-city`, params);
  }

  async searchPlaces(query: SearchPlacesQuery): Promise<Place[]> {
    return apiClient.get<Place[]>(`${this.basePath}/search`, query as any);
  }

  async getPlace(placeId: string, sessionToken?: string): Promise<Place> {
    const params: Record<string, string> = {};
    if (sessionToken) params.sessionToken = sessionToken;
    return apiClient.get<Place>(`${this.basePath}/${placeId}`, params);
  }

  async listPlaces(limit: number = 20, offset: number = 0): Promise<Place[]> {
    return apiClient.get<Place[]>(this.basePath, { limit, offset });
  }

  async getPhotos(query: GetPlacePhotosQuery): Promise<PlacePhoto[]> {
    return apiClient.get<PlacePhoto[]>(`${this.basePath}/photos`, query as any);
  }

  async getReviews(query: GetPlaceReviewsQuery): Promise<PlaceReview[]> {
    return apiClient.get<PlaceReview[]>(`${this.basePath}/review`, query as any);
  }

  async createPlace(data: Partial<Place>): Promise<Place> {
    return apiClient.post<Place>(this.basePath, data);
  }

  async updatePlace(placeId: string, data: Partial<Place>): Promise<Place> {
    return apiClient.patch<Place>(`${this.basePath}/${placeId}`, data);
  }

  async deletePlace(placeId: string): Promise<{ message: string }> {
    return apiClient.delete(`${this.basePath}/${placeId}`);
  }
}

export const placeService = new PlaceService();
