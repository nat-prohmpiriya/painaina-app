import apiClient from "./api-client";
import type {
  User,
  UpdateUserRequest,
  ListResponse,
} from "@/interfaces";

export class UserService {
  private basePath = "/users";

  async getMe(): Promise<User> {
    return apiClient.get<User>(`${this.basePath}/me`);
  }

  async updateMe(data: UpdateUserRequest): Promise<User> {
    return apiClient.patch<User>(`${this.basePath}/me`, data);
  }

  async deleteMe(): Promise<{ message: string; id: string }> {
    return apiClient.delete(`${this.basePath}/me`);
  }

  async getUser(userId: string): Promise<User> {
    return apiClient.get<User>(`${this.basePath}/${userId}`);
  }

  async listUsers(limit: number = 10): Promise<ListResponse<User>> {
    return apiClient.get<ListResponse<User>>(this.basePath, { limit });
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    return apiClient.patch<User>(`${this.basePath}/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<{ message: string; id: string }> {
    return apiClient.delete(`${this.basePath}/${userId}`);
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>(`${this.basePath}/search`, { q: query });
    return response.users;
  }

  // ============================================
  // Backward Compatibility Aliases
  // ============================================

  async getCurrentUser(): Promise<User> {
    return this.getMe();
  }

  async updateProfile(data: UpdateUserRequest): Promise<User> {
    return this.updateMe(data);
  }
}

export const userService = new UserService();
