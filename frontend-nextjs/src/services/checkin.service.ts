import apiClient from "./api-client";
import type {
  CheckIn,
  CheckInListResponse,
  CheckInStats,
  CreateCheckInRequest,
  UpdateCheckInRequest,
} from "@/interfaces/checkin";

export class CheckInService {
  private basePath = "/checkins";

  async createCheckIn(data: CreateCheckInRequest): Promise<CheckIn> {
    return apiClient.post<CheckIn>(this.basePath, data);
  }

  async getCheckIn(checkInId: string): Promise<CheckIn> {
    return apiClient.get<CheckIn>(`${this.basePath}/${checkInId}`);
  }

  async getUserCheckIns(userId: string): Promise<CheckInListResponse> {
    return apiClient.get<CheckInListResponse>(`/users/${userId}/checkins`);
  }

  async getUserCheckInStats(userId: string): Promise<CheckInStats> {
    return apiClient.get<CheckInStats>(`/users/${userId}/checkins/stats`);
  }

  async updateCheckIn(checkInId: string, data: UpdateCheckInRequest): Promise<CheckIn> {
    return apiClient.put<CheckIn>(`${this.basePath}/${checkInId}`, data);
  }

  async deleteCheckIn(checkInId: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${checkInId}`);
  }
}

export const checkInService = new CheckInService();
