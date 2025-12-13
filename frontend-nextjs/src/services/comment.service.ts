import apiClient from "./api-client";
import type {
  Comment,
  CommentWithUser,
  CreateCommentRequest,
  UpdateCommentRequest,
  ListCommentsQuery,
} from "@/interfaces";

export class CommentService {
  async getCommentsByTrip(
    tripId: string,
    query: ListCommentsQuery = {}
  ): Promise<CommentWithUser[]> {
    return apiClient.get<CommentWithUser[]>(`/trips/${tripId}/comments`, query as any);
  }

  async getCommentsByPlace(
    placeId: string,
    query: ListCommentsQuery = {}
  ): Promise<CommentWithUser[]> {
    return apiClient.get<CommentWithUser[]>(`/places/${placeId}/comments`, query as any);
  }

  async getReplies(commentId: string): Promise<CommentWithUser[]> {
    return apiClient.get<CommentWithUser[]>(`/comments/${commentId}/replies`);
  }

  async createTripComment(tripId: string, data: CreateCommentRequest): Promise<Comment> {
    return apiClient.post<Comment>(`/trips/${tripId}/comments`, data);
  }

  async createPlaceComment(placeId: string, data: CreateCommentRequest): Promise<Comment> {
    return apiClient.post<Comment>(`/places/${placeId}/comments`, data);
  }

  async updateComment(
    targetType: "trip" | "place",
    targetId: string,
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<Comment> {
    const basePath = targetType === "trip" ? "trips" : "places";
    return apiClient.patch<Comment>(`/${basePath}/${targetId}/comments/${commentId}`, data);
  }

  async deleteComment(
    targetType: "trip" | "place",
    targetId: string,
    commentId: string
  ): Promise<{ message: string }> {
    const basePath = targetType === "trip" ? "trips" : "places";
    return apiClient.delete(`/${basePath}/${targetId}/comments/${commentId}`);
  }

  async toggleLike(
    targetType: "trip" | "place",
    targetId: string,
    commentId: string
  ): Promise<Comment> {
    const basePath = targetType === "trip" ? "trips" : "places";
    return apiClient.post<Comment>(`/${basePath}/${targetId}/comments/${commentId}/like`);
  }

  // ============================================
  // Backward Compatibility Aliases
  // ============================================

  async getCommentsByGuideId(guideId: string, query: ListCommentsQuery = {}): Promise<CommentWithUser[]> {
    return this.getCommentsByTrip(guideId, query);
  }

  async createComment(targetId: string, data: CreateCommentRequest): Promise<Comment> {
    return this.createTripComment(targetId, data);
  }

  async toggleCommentLike(commentId: string): Promise<void> {
    throw new Error('toggleCommentLike() is deprecated. Use toggleLike(targetType, targetId, commentId) instead.');
  }

}

export const commentService = new CommentService();
