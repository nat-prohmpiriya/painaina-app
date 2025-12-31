import axios from "axios";
import type {
  PackingList,
  PackingStats,
  PackingTemplate,
  CreatePackingItemRequest,
  UpdatePackingItemRequest,
  ReorderPackingItemsRequest,
  ApplyPackingTemplateRequest,
} from "@/interfaces/packing.interface";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const { useAuth } = await import("@clerk/nextjs");
    // Note: This won't work directly, we need to pass token from component
  }
  return config;
});

export const packingService = {
  // Get packing list for a trip
  async getPackingList(tripId: string, token?: string): Promise<PackingList> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(`/trips/${tripId}/packing`, { headers });
    return response.data;
  },

  // Get packing statistics
  async getPackingStats(tripId: string, token?: string): Promise<PackingStats> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(`/trips/${tripId}/packing/stats`, {
      headers,
    });
    return response.data;
  },

  // Add item to packing list
  async addItem(
    tripId: string,
    data: CreatePackingItemRequest,
    token: string
  ): Promise<PackingList> {
    const response = await api.post(`/trips/${tripId}/packing/items`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Update item in packing list
  async updateItem(
    tripId: string,
    itemId: string,
    data: UpdatePackingItemRequest,
    token: string
  ): Promise<PackingList> {
    const response = await api.patch(
      `/trips/${tripId}/packing/items/${itemId}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Delete item from packing list
  async deleteItem(
    tripId: string,
    itemId: string,
    token: string
  ): Promise<PackingList> {
    const response = await api.delete(
      `/trips/${tripId}/packing/items/${itemId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Toggle item packed status
  async toggleItemPacked(
    tripId: string,
    itemId: string,
    token: string
  ): Promise<PackingList> {
    const response = await api.post(
      `/trips/${tripId}/packing/items/${itemId}/toggle`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Reorder items
  async reorderItems(
    tripId: string,
    data: ReorderPackingItemsRequest,
    token: string
  ): Promise<PackingList> {
    const response = await api.post(`/trips/${tripId}/packing/reorder`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Apply template
  async applyTemplate(
    tripId: string,
    data: ApplyPackingTemplateRequest,
    token: string
  ): Promise<PackingList> {
    const response = await api.post(`/trips/${tripId}/packing/template`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get all templates
  async getTemplates(): Promise<PackingTemplate[]> {
    const response = await api.get("/packing/templates");
    return response.data;
  },
};

export default packingService;
