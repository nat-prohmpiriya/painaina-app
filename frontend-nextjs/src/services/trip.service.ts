import apiClient from "./api-client";
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
  ListTripsQuery,
  ListResponse,
  SetBudgetRequest,
  TripMember,
  InviteMemberRequest,
  TripDetailResponse,
} from "@/interfaces";

export class TripService {
  private basePath = "/trips";

  async createTrip(data: CreateTripRequest): Promise<Trip> {
    return apiClient.post<Trip>(this.basePath, data);
  }

  async getTrip(tripId: string): Promise<TripDetailResponse> {
    // Always fetch aggregated data (trip + itineraries + entries + expenses + users)
    return apiClient.get<TripDetailResponse>(`${this.basePath}/${tripId}`);
  }

  async listTrips(query: ListTripsQuery = {}): Promise<ListResponse<Trip>> {
    return apiClient.get<ListResponse<Trip>>(this.basePath, query as any);
  }

  async updateTrip(tripId: string, data: UpdateTripRequest): Promise<Trip> {
    return apiClient.patch<Trip>(`${this.basePath}/${tripId}`, data);
  }

  async deleteTrip(tripId: string): Promise<{ message: string; id: string }> {
    return apiClient.delete(`${this.basePath}/${tripId}`);
  }

  async setBudget(tripId: string, data: SetBudgetRequest): Promise<Trip> {
    return apiClient.post<Trip>(`${this.basePath}/${tripId}/budget`, data);
  }

  async getMembers(tripId: string): Promise<TripMember[]> {
    return apiClient.get<TripMember[]>(`${this.basePath}/${tripId}/members`);
  }

  async inviteMember(tripId: string, data: InviteMemberRequest): Promise<TripMember> {
    return apiClient.post<TripMember>(`${this.basePath}/${tripId}/members`, data);
  }

  async removeMember(tripId: string, userId: string): Promise<{ message: string }> {
    return apiClient.delete(`${this.basePath}/${tripId}/members/${userId}`);
  }

  async updateMemberRole(
    tripId: string,
    userId: string,
    role: "owner" | "admin" | "editor" | "viewer"
  ): Promise<TripMember> {
    return apiClient.patch<TripMember>(`${this.basePath}/${tripId}/members/${userId}`, { role });
  }

  // ============================================
  // Backward Compatibility Aliases
  // ============================================

  async getMyTrips(query: ListTripsQuery = {}): Promise<ListResponse<Trip>> {
    return this.listTrips(query);
  }
}

export const tripService = new TripService();
