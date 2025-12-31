import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { packingService } from "@/services/packing.service";
import type {
  CreatePackingItemRequest,
  UpdatePackingItemRequest,
  ReorderPackingItemsRequest,
  ApplyPackingTemplateRequest,
} from "@/interfaces/packing.interface";

// Query keys
export const packingKeys = {
  all: ["packing"] as const,
  list: (tripId: string) => [...packingKeys.all, "list", tripId] as const,
  stats: (tripId: string) => [...packingKeys.all, "stats", tripId] as const,
  templates: () => [...packingKeys.all, "templates"] as const,
};

// Get packing list for a trip
export function usePackingList(tripId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: packingKeys.list(tripId),
    queryFn: async () => {
      const token = await getToken();
      return packingService.getPackingList(tripId, token || undefined);
    },
    enabled: !!tripId,
  });
}

// Get packing stats for a trip
export function usePackingStats(tripId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: packingKeys.stats(tripId),
    queryFn: async () => {
      const token = await getToken();
      return packingService.getPackingStats(tripId, token || undefined);
    },
    enabled: !!tripId,
  });
}

// Get all templates
export function usePackingTemplates() {
  return useQuery({
    queryKey: packingKeys.templates(),
    queryFn: () => packingService.getTemplates(),
  });
}

// Add item mutation
export function useAddPackingItem(tripId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: CreatePackingItemRequest) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return packingService.addItem(tripId, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.list(tripId) });
      queryClient.invalidateQueries({ queryKey: packingKeys.stats(tripId) });
    },
  });
}

// Update item mutation
export function useUpdatePackingItem(tripId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: UpdatePackingItemRequest;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return packingService.updateItem(tripId, itemId, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.list(tripId) });
      queryClient.invalidateQueries({ queryKey: packingKeys.stats(tripId) });
    },
  });
}

// Delete item mutation
export function useDeletePackingItem(tripId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return packingService.deleteItem(tripId, itemId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.list(tripId) });
      queryClient.invalidateQueries({ queryKey: packingKeys.stats(tripId) });
    },
  });
}

// Toggle packed status mutation
export function useTogglePackingItem(tripId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return packingService.toggleItemPacked(tripId, itemId, token);
    },
    onSuccess: (data) => {
      // Optimistic update - update cache directly
      queryClient.setQueryData(packingKeys.list(tripId), data);
      queryClient.invalidateQueries({ queryKey: packingKeys.stats(tripId) });
    },
  });
}

// Reorder items mutation
export function useReorderPackingItems(tripId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: ReorderPackingItemsRequest) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return packingService.reorderItems(tripId, data, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(packingKeys.list(tripId), data);
    },
  });
}

// Apply template mutation
export function useApplyPackingTemplate(tripId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: ApplyPackingTemplateRequest) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return packingService.applyTemplate(tripId, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.list(tripId) });
      queryClient.invalidateQueries({ queryKey: packingKeys.stats(tripId) });
    },
  });
}
