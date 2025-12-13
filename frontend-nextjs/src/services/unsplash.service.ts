import apiClient from "./api-client";
import type {
  UnsplashPhoto,
  SearchPhotosQuery,
  SearchPhotosResponse,
  GetRandomPhotosQuery,
  TriggerDownloadRequest,
} from "@/interfaces";

export class UnsplashService {
  private basePath = "/unsplash";

  async searchPhotos(query: SearchPhotosQuery): Promise<SearchPhotosResponse> {
    return apiClient.get<SearchPhotosResponse>(`${this.basePath}/search`, query as any);
  }

  // Alias for backward compatibility
  async searchCityPhotos(cityName: string, count: number = 10): Promise<UnsplashPhoto[]> {
    const response = await this.searchPhotos({ query: cityName, perPage: count });
    return response.results;
  }

  async getRandomPhotos(query?: GetRandomPhotosQuery): Promise<UnsplashPhoto[]> {
    return apiClient.get<UnsplashPhoto[]>(`${this.basePath}/random`, query as any);
  }

  async getPhoto(photoId: string): Promise<UnsplashPhoto> {
    return apiClient.get<UnsplashPhoto>(`${this.basePath}/photos/${photoId}`);
  }

  async triggerDownload(data: TriggerDownloadRequest): Promise<{ url: string }> {
    return apiClient.post<{ url: string }>(`${this.basePath}/download`, data);
  }
}

export const unsplashService = new UnsplashService();
