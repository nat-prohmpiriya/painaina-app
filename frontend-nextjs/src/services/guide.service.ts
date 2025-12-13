import apiClient from "./api-client";
import type { Trip, ListResponse } from "@/interfaces";

export interface SearchGuidesQuery {
  q?: string; // search keyword
  tags?: string; // comma-separated tags
  status?: "draft" | "published";
  limit?: number;
  offset?: number;
}

export class GuideService {
  private basePath = "/trips";

  /**
   * Search guides with filters
   * @param query - Search and filter parameters
   * @returns List of guides with pagination metadata
   */
  async searchGuides(query: SearchGuidesQuery = {}): Promise<ListResponse<Trip>> {
    // Always add type=guide to filter only guides
    const params = {
      ...query,
      type: "guide",
    };

    return apiClient.get<ListResponse<Trip>>(this.basePath, params as any);
  }

  /**
   * Get a single guide by ID
   * @param guideId - The guide's ID
   * @returns Guide details
   */
  async getGuide(guideId: string): Promise<Trip> {
    return apiClient.get<Trip>(`${this.basePath}/${guideId}`);
  }

  /**
   * Get published guides only
   * @param query - Search and filter parameters
   * @returns List of published guides
   */
  async getPublishedGuides(query: Omit<SearchGuidesQuery, "status"> = {}): Promise<ListResponse<Trip>> {
    return this.searchGuides({
      ...query,
      status: "published",
    });
  }
}

export const guideService = new GuideService();
