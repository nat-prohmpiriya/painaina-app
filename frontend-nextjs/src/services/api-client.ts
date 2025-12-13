import { useAuth } from "@clerk/nextjs";
import axios, { type AxiosError } from "axios";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

// Create axios instance
export const painainaApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store token getter function
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

// Request interceptor: Add auth token
painainaApi.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Unwrap data and handle errors
painainaApi.interceptors.response.use(
  (response) => {
    // Backend-go wraps responses in { success: true, data: ... }
    // Extract the data field if it exists
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (tokenGetter) {
        try {
          // Force token refresh by calling getToken again
          const newToken = await tokenGetter();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return painainaApi(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Redirect to login or handle auth failure
          if (typeof window !== "undefined") {
            window.location.href = "/sign-in";
          }
          return Promise.reject(refreshError);
        }
      }
    }

    // Transform axios error to ApiError
    const apiError = new ApiError(
      error.response?.status || 500,
      error.response?.statusText || "Unknown Error",
      error.response?.data
    );

    return Promise.reject(apiError);
  }
);

// Wrapper class for cleaner API calls (auto-unwrap response.data)
class ApiClient {
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await painainaApi.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await painainaApi.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await painainaApi.patch<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await painainaApi.put<T>(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await painainaApi.delete<T>(url);
    return response.data;
  }
}

const apiClient = new ApiClient();

// Hook to use API client with auth in client components
export function usePainainaApi() {
  const { getToken } = useAuth();

  // Set token getter on mount
  if (typeof window !== "undefined") {
    setAuthTokenGetter(getToken);
  }

  return painainaApi;
}

// Export for backward compatibility
export default apiClient;
