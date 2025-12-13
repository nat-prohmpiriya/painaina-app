'use client'

import { createContext, useContext, ReactNode, useMemo } from 'react'
import {
  useTrip,
  useUpdateTrip,
} from '@/hooks/useTripQueries'
import {
  useCreateItinerary,
  useAddDay,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  useDeleteItinerary,
  useInsertItineraryAfter,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useReorderTodos,
  useToggleTodo,
  useReorderEntries,
} from '@/hooks/useItineraryQueries'
import type {
  Trip,
  Itinerary,
  CreateEntryRequest,
  UpdateEntryRequest,
  TripDetailResponse,
  TripUserInfo,
  TripMemberWithUser,
  ItineraryWithEntries,
  Expense,
} from '@/interfaces'

interface TripContextType {
  // Aggregated data from single API call
  fullData: TripDetailResponse | undefined

  // Separated data for easy access
  tripData: Trip | undefined
  itineraries: ItineraryWithEntries[]
  expenses: Expense[]
  owner: TripUserInfo | undefined
  members: TripMemberWithUser[]

  // Loading states
  isLoading: boolean
  error: any
  refetch: () => void

  // Mutations
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>
  createItinerary: () => Promise<string>
  addDay: (title: string, date: string, order: number) => Promise<string>
  insertDayAfter: (itineraryId: string) => Promise<void>
  addEntry: (dayId: string, entry: CreateEntryRequest & { order: number }) => Promise<string>
  updateEntry: (entryId: string, updates: UpdateEntryRequest) => Promise<void>
  deleteEntry: (entryId: string) => Promise<void>
  deleteDay: (dayId: string) => Promise<void>

  // Todo mutations
  addTodo: (entryId: string, title: string, order: number) => Promise<string>
  updateTodoStatus: (entryId: string, todoId: string) => Promise<void>
  updateTodoTitle: (entryId: string, todoId: string, title: string) => Promise<void>
  deleteTodo: (entryId: string, todoId: string) => Promise<void>

  // Reorder functions
  reorderEntries: (entryIds: string[]) => Promise<void>
  reorderTodos: (entryId: string, todoIds: string[]) => Promise<void>
}

const TripContext = createContext<TripContextType | undefined>(undefined)

interface TripProviderProps {
  children: ReactNode
  tripId: string
}

export function TripProvider({ children, tripId }: TripProviderProps) {
  // Single API call to get all aggregated data
  const {
    data: fullData,
    isLoading,
    error,
    refetch,
  } = useTrip(tripId)

  // Separate data for easy component access
  const tripData = useMemo(() => {
    if (!fullData) return undefined

    return {
      id: fullData.id,
      title: fullData.title,
      description: fullData.description,
      destination: {
        name: fullData.destinations.name,
        country: fullData.destinations.country,
        address: fullData.destinations.address,
        coordinates: fullData.destinations.coordinates,
        placeId: fullData.destinations.placeId,
      },
      startDate: fullData.startDate,
      endDate: fullData.endDate,
      coverPhoto: fullData.coverPhoto,
      type: fullData.type,
      status: fullData.status,
      level: fullData.level,
      tags: fullData.tags,
      ownerId: fullData.ownerId,
      viewCount: fullData.viewCount,
      reactionsCount: fullData.reactionsCount,
      budget: fullData.budgetTotal && fullData.budgetCurrency ? {
        amount: fullData.budgetTotal,
        currency: fullData.budgetCurrency,
      } : undefined,
      tripMembers: fullData.tripMembers,
      createdAt: fullData.createdAt,
      updatedAt: fullData.updatedAt,
    } as Trip
  }, [fullData])

  const itineraries = fullData?.itineraries || []
  const expenses = fullData?.expenses || []
  const owner = fullData?.owner
  const members = fullData?.tripMembers || []

  const itineraryData = itineraries[0] // First itinerary for backward compatibility

  // Mutations
  const updateTripMutation = useUpdateTrip()
  const createItineraryMutation = useCreateItinerary()
  const addDayMutation = useAddDay()
  const insertItineraryAfterMutation = useInsertItineraryAfter()
  const createEntryMutation = useCreateEntry()
  const updateEntryMutation = useUpdateEntry()
  const deleteEntryMutation = useDeleteEntry()
  const deleteItineraryMutation = useDeleteItinerary()
  const createTodoMutation = useCreateTodo()
  const updateTodoMutation = useUpdateTodo()
  const deleteTodoMutation = useDeleteTodo()
  const reorderTodosMutation = useReorderTodos()
  const toggleTodoMutation = useToggleTodo()
  const reorderEntriesMutation = useReorderEntries()

  const updateTrip = async (tripId: string, updates: Partial<Trip>) => {
    await updateTripMutation.mutateAsync({ tripId, data: updates })
  }

  const createItinerary = async () => {
    const result = await createItineraryMutation.mutateAsync({
      tripId,
      data: { tripId },
    })
    return result.id
  }

  const addDay = async (title: string, date: string, order: number) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    const result = await addDayMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      data: { title, date, order },
    })
    return result.id
  }

  const addEntry = async (dayId: string, entry: CreateEntryRequest & { order: number }) => {
    const result = await createEntryMutation.mutateAsync({
      tripId,
      itineraryId: dayId,
      data: entry,
    })
    return result.id
  }

  const updateEntry = async (entryId: string, updates: UpdateEntryRequest) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    await updateEntryMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryId,
      data: updates,
    })
  }

  const deleteEntry = async (entryId: string) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    await deleteEntryMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryId,
    })
  }

  const deleteDay = async (dayId: string) => {
    await deleteItineraryMutation.mutateAsync({
      tripId,
      itineraryId: dayId,
    })
  }

  const insertDayAfter = async (itineraryId: string) => {
    await insertItineraryAfterMutation.mutateAsync({
      tripId,
      itineraryId,
    })
  }

  // Todo functions
  const addTodo = async (entryId: string, title: string, order: number) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    const result = await createTodoMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryId,
      data: { title, order },
    })
    return result.id
  }

  const updateTodoStatus = async (entryId: string, todoId: string) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    await toggleTodoMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryId,
      todoId,
    })
  }

  const updateTodoTitle = async (entryId: string, todoId: string, title: string) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    await updateTodoMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryId,
      todoId,
      data: { title },
    })
  }

  const deleteTodo = async (entryId: string, todoId: string) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    await deleteTodoMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryId,
      todoId,
    })
  }

  // Reorder functions
  const reorderEntries = async (entryIds: string[]) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    await reorderEntriesMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryIds,
    })
  }

  const reorderTodos = async (entryId: string, todoIds: string[]) => {
    if (!itineraryData) {
      throw new Error('No itinerary found')
    }

    await reorderTodosMutation.mutateAsync({
      tripId,
      itineraryId: itineraryData.id,
      entryId,
      data: { todoIds },
    })
  }

  return (
    <TripContext.Provider
      value={{
        fullData,
        tripData,
        itineraries,
        expenses,
        owner,
        members,
        isLoading,
        error,
        refetch,
        updateTrip,
        createItinerary,
        addDay,
        insertDayAfter,
        addEntry,
        updateEntry,
        deleteEntry,
        deleteDay,
        addTodo,
        updateTodoStatus,
        updateTodoTitle,
        deleteTodo,
        reorderEntries,
        reorderTodos,
      }}
    >
      {children}
    </TripContext.Provider>
  )
}

export function useTripContext() {
  const context = useContext(TripContext)
  if (context === undefined) {
    throw new Error('useTripContext must be used within a TripProvider')
  }
  return context
}
