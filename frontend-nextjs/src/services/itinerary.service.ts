import apiClient from "./api-client";
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
  ItineraryDay,
  Todo,
} from "@/interfaces";

export class ItineraryService {
  async getItinerariesByTrip(tripId: string): Promise<Itinerary[]> {
    return apiClient.get<Itinerary[]>(`/trips/${tripId}/itineraries`);
  }

  async getItinerary(tripId: string, itineraryId: string): Promise<Itinerary> {
    return apiClient.get<Itinerary>(`/trips/${tripId}/itineraries/${itineraryId}`);
  }

  async getEntriesByItinerary(tripId: string, itineraryId: string): Promise<ItineraryEntry[]> {
    return apiClient.get<ItineraryEntry[]>(`/trips/${tripId}/itineraries/${itineraryId}/entries`);
  }

  async getEntry(tripId: string, itineraryId: string, entryId: string): Promise<ItineraryEntry> {
    return apiClient.get<ItineraryEntry>(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}`
    );
  }

  async createItinerary(tripId: string, data: CreateItineraryRequest): Promise<Itinerary> {
    return apiClient.post<Itinerary>(`/trips/${tripId}/itineraries`, data);
  }

  async updateItinerary(
    tripId: string,
    itineraryId: string,
    data: UpdateItineraryRequest
  ): Promise<Itinerary> {
    return apiClient.patch<Itinerary>(`/trips/${tripId}/itineraries/${itineraryId}`, data);
  }

  async deleteItinerary(tripId: string, itineraryId: string): Promise<{ message: string }> {
    return apiClient.delete(`/trips/${tripId}/itineraries/${itineraryId}`);
  }

  async createEntry(
    tripId: string,
    itineraryId: string,
    data: CreateEntryRequest
  ): Promise<ItineraryEntry> {
    return apiClient.post<ItineraryEntry>(
      `/trips/${tripId}/itineraries/${itineraryId}/entries`,
      data
    );
  }

  async updateEntry(
    tripId: string,
    itineraryId: string,
    entryId: string,
    data: UpdateEntryRequest
  ): Promise<ItineraryEntry> {
    return apiClient.patch<ItineraryEntry>(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}`,
      data
    );
  }

  async deleteEntry(tripId: string, itineraryId: string, entryId: string): Promise<{ message: string }> {
    return apiClient.delete(`/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}`);
  }

  async createTodo(
    tripId: string,
    itineraryId: string,
    entryId: string,
    data: CreateTodoRequest
  ): Promise<Todo> {
    return apiClient.post<Todo>(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}/todos`,
      data
    );
  }

  async updateTodo(
    tripId: string,
    itineraryId: string,
    entryId: string,
    todoId: string,
    data: UpdateTodoRequest
  ): Promise<{ message: string }> {
    return apiClient.patch(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}/todos/${todoId}`,
      data
    );
  }

  async deleteTodo(
    tripId: string,
    itineraryId: string,
    entryId: string,
    todoId: string
  ): Promise<{ message: string }> {
    return apiClient.delete(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}/todos/${todoId}`
    );
  }

  async reorderTodos(
    tripId: string,
    itineraryId: string,
    entryId: string,
    data: ReorderTodosRequest
  ): Promise<{ message: string }> {
    return apiClient.patch(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}/todos/reorder`,
      data
    );
  }

  async toggleTodo(
    tripId: string,
    itineraryId: string,
    entryId: string,
    todoId: string
  ): Promise<{ message: string }> {
    return apiClient.post(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/${entryId}/todos/${todoId}/toggle`,
      {}
    );
  }

  async reorderEntries(
    tripId: string,
    itineraryId: string,
    entryIds: string[]
  ): Promise<{ message: string; entries: any[] }> {
    return apiClient.patch(
      `/trips/${tripId}/itineraries/${itineraryId}/entries/reorder`,
      { entryIds }
    );
  }

  async addDay(tripId: string, itineraryId: string, data: AddDayRequest): Promise<ItineraryDay> {
    return apiClient.post<ItineraryDay>(`/trips/${tripId}/itineraries/${itineraryId}/days`, data);
  }

  async insertItineraryAfter(tripId: string, itineraryId: string): Promise<Itinerary> {
    return apiClient.post<Itinerary>(
      `/trips/${tripId}/itineraries/${itineraryId}/insert-after`,
      {}
    );
  }
}

export const itineraryService = new ItineraryService();
