import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itineraryService } from '@/services'
import { tripKeys } from './useTripQueries'
import type {
  Itinerary,
  ItineraryEntry,
  CreateItineraryRequest,
  UpdateItineraryRequest,
  CreateEntryRequest,
  UpdateEntryRequest,
  CreateTodoRequest,
  UpdateTodoRequest,
  ReorderTodosRequest,
  AddDayRequest,
  Todo,
} from '@/interfaces'

// ============================================
// Query Keys
// ============================================
export const itineraryKeys = {
  all: ['itineraries'] as const,
  byTrip: (tripId: string) => [...itineraryKeys.all, 'trip', tripId] as const,
  detail: (tripId: string, itineraryId: string) =>
    [...itineraryKeys.all, 'detail', tripId, itineraryId] as const,
  entries: (tripId: string, itineraryId: string) =>
    [...itineraryKeys.detail(tripId, itineraryId), 'entries'] as const,
  entry: (tripId: string, itineraryId: string, entryId: string) =>
    [...itineraryKeys.entries(tripId, itineraryId), entryId] as const,
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch itineraries by trip ID
 */
export const useItinerariesByTrip = (tripId: string) => {
  return useQuery({
    queryKey: itineraryKeys.byTrip(tripId),
    queryFn: () => itineraryService.getItinerariesByTrip(tripId),
    enabled: !!tripId,
  })
}

/**
 * Fetch single itinerary
 */
export const useItinerary = (tripId: string, itineraryId: string) => {
  return useQuery({
    queryKey: itineraryKeys.detail(tripId, itineraryId),
    queryFn: () => itineraryService.getItinerary(tripId, itineraryId),
    enabled: !!tripId && !!itineraryId,
  })
}

/**
 * Fetch entries by itinerary
 */
export const useItineraryEntries = (tripId: string, itineraryId: string) => {
  return useQuery({
    queryKey: itineraryKeys.entries(tripId, itineraryId),
    queryFn: () => itineraryService.getEntriesByItinerary(tripId, itineraryId),
    enabled: !!tripId && !!itineraryId,
  })
}

/**
 * Fetch single entry
 */
export const useItineraryEntry = (tripId: string, itineraryId: string, entryId: string) => {
  return useQuery({
    queryKey: itineraryKeys.entry(tripId, itineraryId, entryId),
    queryFn: () => itineraryService.getEntry(tripId, itineraryId, entryId),
    enabled: !!tripId && !!itineraryId && !!entryId,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new itinerary
 */
export const useCreateItinerary = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, data }: { tripId: string; data: CreateItineraryRequest }) =>
      itineraryService.createItinerary(tripId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.byTrip(variables.tripId) })
    },
  })
}

/**
 * Update itinerary
 */
export const useUpdateItinerary = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      data,
    }: {
      tripId: string
      itineraryId: string
      data: UpdateItineraryRequest
    }) => itineraryService.updateItinerary(tripId, itineraryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.detail(variables.tripId, variables.itineraryId),
      })
      queryClient.invalidateQueries({ queryKey: itineraryKeys.byTrip(variables.tripId) })
    },
  })
}

/**
 * Delete itinerary
 */
export const useDeleteItinerary = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, itineraryId }: { tripId: string; itineraryId: string }) =>
      itineraryService.deleteItinerary(tripId, itineraryId),
    onSuccess: (_, variables) => {
      // Invalidate trip detail to update itineraries list
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(variables.tripId) })
      // Invalidate itineraries list
      queryClient.invalidateQueries({ queryKey: itineraryKeys.byTrip(variables.tripId) })
    },
  })
}

/**
 * Insert itinerary after (Insert Day After)
 */
export const useInsertItineraryAfter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, itineraryId }: { tripId: string; itineraryId: string }) =>
      itineraryService.insertItineraryAfter(tripId, itineraryId),
    onSuccess: (_, variables) => {
      // Invalidate trip detail to get updated endDate
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(variables.tripId) })
      // Invalidate itineraries to get all shifted days
      queryClient.invalidateQueries({ queryKey: itineraryKeys.byTrip(variables.tripId) })
    },
  })
}

/**
 * Create entry with optimistic update
 */
export const useCreateEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      data,
    }: {
      tripId: string
      itineraryId: string
      data: CreateEntryRequest
    }) => itineraryService.createEntry(tripId, itineraryId, data),

    onMutate: async ({ tripId, itineraryId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['trips', 'detail', tripId] })
      const previousData = queryClient.getQueryData(['trips', 'detail', tripId])

      // Create temp entry with temp ID
      const tempEntry = {
        id: `temp-${Date.now()}`,
        itineraryId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Optimistically add entry
      queryClient.setQueryData(['trips', 'detail', tripId], (old: any) => {
        if (!old) return old

        return {
          ...old,
          itineraries: old.itineraries?.map((itinerary: any) =>
            itinerary.id === itineraryId
              ? {
                  ...itinerary,
                  entries: [...(itinerary.entries || []), tempEntry],
                }
              : itinerary
          ),
        }
      })

      return { previousData, tempId: tempEntry.id }
    },

    onSuccess: (response, { tripId, itineraryId }, context) => {
      // Replace temp entry with real entry
      queryClient.setQueryData(['trips', 'detail', tripId], (old: any) => {
        if (!old) return old

        return {
          ...old,
          itineraries: old.itineraries?.map((itinerary: any) =>
            itinerary.id === itineraryId
              ? {
                  ...itinerary,
                  entries: itinerary.entries?.map((entry: any) =>
                    entry.id === context?.tempId ? response : entry
                  ),
                }
              : itinerary
          ),
        }
      })
    },

    onError: (err, { tripId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['trips', 'detail', tripId], context.previousData)
      }
    },

    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Update entry with optimistic update
 */
export const useUpdateEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryId,
      data,
    }: {
      tripId: string
      itineraryId: string
      entryId: string
      data: UpdateEntryRequest
    }) => itineraryService.updateEntry(tripId, itineraryId, entryId, data),

    onMutate: async ({ tripId, entryId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['trips', 'detail', tripId] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData(['trips', 'detail', tripId])

      // Optimistically update cache
      queryClient.setQueryData(['trips', 'detail', tripId], (old: any) => {
        if (!old) return old

        return {
          ...old,
          itineraries: old.itineraries?.map((itinerary: any) => ({
            ...itinerary,
            entries: itinerary.entries?.map((entry: any) =>
              entry.id === entryId ? { ...entry, ...data } : entry
            ),
          })),
        }
      })

      return { previousData }
    },

    onError: (err, { tripId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['trips', 'detail', tripId], context.previousData)
      }
    },

    onSettled: (_, __, variables) => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Delete entry with optimistic update
 */
export const useDeleteEntry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryId,
    }: {
      tripId: string
      itineraryId: string
      entryId: string
    }) => itineraryService.deleteEntry(tripId, itineraryId, entryId),

    onMutate: async ({ tripId, entryId }) => {
      await queryClient.cancelQueries({ queryKey: ['trips', 'detail', tripId] })
      const previousData = queryClient.getQueryData(['trips', 'detail', tripId])

      // Optimistically remove entry
      queryClient.setQueryData(['trips', 'detail', tripId], (old: any) => {
        if (!old) return old

        return {
          ...old,
          itineraries: old.itineraries?.map((itinerary: any) => ({
            ...itinerary,
            entries: itinerary.entries?.filter((entry: any) => entry.id !== entryId),
          })),
        }
      })

      return { previousData }
    },

    onError: (err, { tripId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['trips', 'detail', tripId], context.previousData)
      }
    },

    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Create todo in entry
 */
export const useCreateTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryId,
      data,
    }: {
      tripId: string
      itineraryId: string
      entryId: string
      data: CreateTodoRequest
    }) => itineraryService.createTodo(tripId, itineraryId, entryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Update todo title
 */
export const useUpdateTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryId,
      todoId,
      data,
    }: {
      tripId: string
      itineraryId: string
      entryId: string
      todoId: string
      data: UpdateTodoRequest
    }) => itineraryService.updateTodo(tripId, itineraryId, entryId, todoId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Delete todo
 */
export const useDeleteTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryId,
      todoId,
    }: {
      tripId: string
      itineraryId: string
      entryId: string
      todoId: string
    }) => itineraryService.deleteTodo(tripId, itineraryId, entryId, todoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Reorder todos in entry
 */
export const useReorderTodos = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryId,
      data,
    }: {
      tripId: string
      itineraryId: string
      entryId: string
      data: ReorderTodosRequest
    }) => itineraryService.reorderTodos(tripId, itineraryId, entryId, data),
    onSuccess: (_, variables) => {
      // Invalidate trip detail to refetch updated todos
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Toggle todo completed status
 */
export const useToggleTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryId,
      todoId,
    }: {
      tripId: string
      itineraryId: string
      entryId: string
      todoId: string
    }) => itineraryService.toggleTodo(tripId, itineraryId, entryId, todoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', variables.tripId] })
    },
  })
}

/**
 * Reorder entries in an itinerary
 */
export const useReorderEntries = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      entryIds,
    }: {
      tripId: string
      itineraryId: string
      entryIds: string[]
    }) => itineraryService.reorderEntries(tripId, itineraryId, entryIds),
    onSuccess: (response, variables) => {
      if (response?.entries) {
        queryClient.setQueryData(['trips', 'detail', variables.tripId], (oldData: any) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            itineraries: oldData.itineraries?.map((day: any) =>
              day.id === variables.itineraryId
                ? {
                    ...day,
                    entries: response.entries,
                  }
                : day
            ),
          }
        })
      }
    },
  })
}

/**
 * Add day to itinerary
 */
export const useAddDay = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      itineraryId,
      data,
    }: {
      tripId: string
      itineraryId: string
      data: AddDayRequest
    }) => itineraryService.addDay(tripId, itineraryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: itineraryKeys.detail(variables.tripId, variables.itineraryId),
      })
    },
  })
}

// ============================================
// Helper Hooks with Optimized Actions
// ============================================

/**
 * Hook for creating place entry with optimized parameters
 */
export const useCreatePlaceEntry = () => {
  const createEntry = useCreateEntry()

  const createPlaceEntry = async (params: {
    itineraryId: string
    tripId: string
    title: string
    place: {
      placeId: string
      name: string
      photoReference?: string
      photoPlace?: string[]
      types?: string[]
      location: { lat: number; lng: number }
    }
    startTime?: string
    endTime?: string
    notes?: string
    order: number
  }) => {
    return await createEntry.mutateAsync({
      tripId: params.tripId,
      itineraryId: params.itineraryId,
      data: {
        type: 'place',
        title: params.title,
        place: {
          ...params.place,
          location: {
            type: 'Point',
            coordinates: [params.place.location.lng, params.place.location.lat],
            latitude: params.place.location.lat,
            longitude: params.place.location.lng,
          },
        },
        startTime: params.startTime,
        endTime: params.endTime,
        notes: params.notes,
        order: params.order,
      },
    })
  }

  return {
    createPlaceEntry,
    isLoading: createEntry.isPending,
    error: createEntry.error,
  }
}

/**
 * Hook for creating note entry
 */
export const useCreateNoteEntry = () => {
  const createEntry = useCreateEntry()

  const createNoteEntry = async (params: {
    itineraryId: string
    tripId: string
    title: string
    notes?: string
    startTime?: string
    endTime?: string
    order: number
  }) => {
    return await createEntry.mutateAsync({
      tripId: params.tripId,
      itineraryId: params.itineraryId,
      data: {
        type: 'note',
        title: params.title,
        notes: params.notes,
        startTime: params.startTime,
        endTime: params.endTime,
        order: params.order,
      },
    })
  }

  return {
    createNoteEntry,
    isLoading: createEntry.isPending,
    error: createEntry.error,
  }
}

/**
 * Hook for creating todos entry with todos
 */
export const useCreateTodoListEntry = () => {
  const createEntry = useCreateEntry()

  const createTodoListEntry = async (params: {
    itineraryId: string
    tripId: string
    title: string
    description?: string
    todos?: Omit<Todo, '_id'>[]
    startTime?: string
    endTime?: string
    order: number
  }) => {
    return await createEntry.mutateAsync({
      tripId: params.tripId,
      itineraryId: params.itineraryId,
      data: {
        type: 'todos',
        title: params.title,
        description: params.description,
        todos: params.todos,
        startTime: params.startTime,
        endTime: params.endTime,
        order: params.order,
      },
    })
  }

  return {
    createTodoListEntry,
    isLoading: createEntry.isPending,
    error: createEntry.error,
  }
}
