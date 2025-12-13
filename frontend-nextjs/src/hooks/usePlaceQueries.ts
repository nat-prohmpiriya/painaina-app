import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { placeService } from '@/services'
import type {
  Place,
  AutocompleteResult,
  SearchPlacesQuery,
  GetPlacePhotosQuery,
  GetPlaceReviewsQuery,
  PlacePhoto,
  PlaceReview,
} from '@/interfaces'

// ============================================
// Query Keys
// ============================================
export const placeKeys = {
  all: ['places'] as const,
  lists: () => [...placeKeys.all, 'list'] as const,
  list: (filters: any) => [...placeKeys.lists(), filters] as const,
  details: () => [...placeKeys.all, 'detail'] as const,
  detail: (id: string) => [...placeKeys.details(), id] as const,
  autocomplete: (input: string) => [...placeKeys.all, 'autocomplete', input] as const,
  autocompleteCity: (input: string) => [...placeKeys.all, 'autocomplete-city', input] as const,
  search: (query: SearchPlacesQuery) => [...placeKeys.all, 'search', query] as const,
  photos: (query: GetPlacePhotosQuery) => [...placeKeys.all, 'photos', query] as const,
  reviews: (query: GetPlaceReviewsQuery) => [...placeKeys.all, 'reviews', query] as const,
}

// ============================================
// Query Hooks
// ============================================

/**
 * Autocomplete places
 */
export const useAutocomplete = (input: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: placeKeys.autocomplete(input),
    queryFn: () => placeService.autocomplete(input),
    enabled: enabled && input.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Autocomplete cities
 */
export const useAutocompleteCity = (input: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: placeKeys.autocompleteCity(input),
    queryFn: () => placeService.autocompleteCity(input),
    enabled: enabled && input.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Search places
 */
export const useSearchPlaces = (query: SearchPlacesQuery, enabled: boolean = true) => {
  return useQuery({
    queryKey: placeKeys.search(query),
    queryFn: () => placeService.searchPlaces(query),
    enabled: enabled && !!query.query,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Get place by ID
 */
export const usePlace = (placeId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: placeKeys.detail(placeId),
    queryFn: () => placeService.getPlace(placeId),
    enabled: enabled && !!placeId,
  })
}

/**
 * List places
 */
export const usePlaces = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: placeKeys.list({ limit, offset }),
    queryFn: () => placeService.listPlaces(limit, offset),
  })
}

/**
 * Get place photos
 */
export const usePlacePhotos = (query: GetPlacePhotosQuery, enabled: boolean = true) => {
  return useQuery({
    queryKey: placeKeys.photos(query),
    queryFn: () => placeService.getPhotos(query),
    enabled: enabled && !!query.placeId,
  })
}

/**
 * Get place reviews
 */
export const usePlaceReviews = (query: GetPlaceReviewsQuery, enabled: boolean = true) => {
  return useQuery({
    queryKey: placeKeys.reviews(query),
    queryFn: () => placeService.getReviews(query),
    enabled: enabled && !!query.placeId,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create place
 */
export const useCreatePlace = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Place>) => placeService.createPlace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.lists() })
    },
  })
}

/**
 * Update place
 */
export const useUpdatePlace = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ placeId, data }: { placeId: string; data: Partial<Place> }) =>
      placeService.updatePlace(placeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: placeKeys.detail(variables.placeId) })
      queryClient.invalidateQueries({ queryKey: placeKeys.lists() })
    },
  })
}

/**
 * Delete place
 */
export const useDeletePlace = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (placeId: string) => placeService.deletePlace(placeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.all })
    },
  })
}
