export type CommentTargetType = "trip" | "place";

export interface Comment {
  id: string;
  targetId: string;
  targetType: CommentTargetType;
  userId: string;
  content: string;
  photos?: string[];
  parentId?: string;
  reactionsCount: number;
  repliesCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  photos?: string[];
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
  photos?: string[];
}

export interface ListCommentsQuery {
  limit?: number;
  offset?: number;
  sortBy?: "latest" | "popular";
}

export interface CommentWithUser extends Comment {
  user: {
    _id: string;
    name: string;
    photoUrl?: string;
  };
  replies?: CommentWithUser[];
  isLikedByCurrentUser?: boolean;
}
