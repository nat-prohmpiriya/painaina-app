package schemas

type CreateCommentRequest struct {
	Content  string   `json:"content" binding:"required,min=1,max=2000"`
	Photos   []string `json:"photos,omitempty"`
	ParentID *string  `json:"parentId,omitempty"` // For replies
}

type UpdateCommentRequest struct {
	Content string   `json:"content" binding:"required,min=1,max=2000"`
	Photos  []string `json:"photos,omitempty"`
}

type ListCommentsRequest struct {
	Limit  int `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset int `form:"offset" binding:"omitempty,min=0"`
}

type CommentResponse struct {
	ID             string             `json:"id"`
	UserID         string             `json:"userId"`
	TargetID       string             `json:"targetId"`
	TargetType     string             `json:"targetType"`
	Content        string             `json:"content"`
	Photos         []string           `json:"photos,omitempty"`
	ReactionsCount int                `json:"reactionsCount"`
	RepliesCount   int                `json:"repliesCount"`
	ParentID       *string            `json:"parentId,omitempty"`
	IsEdited       bool               `json:"isEdited"`
	CreatedAt      string             `json:"createdAt"`
	UpdatedAt      string             `json:"updatedAt"`
	User           *UserInfo          `json:"user,omitempty"`
	Replies        []*CommentResponse `json:"replies,omitempty"`
	IsLikedByCurrentUser bool         `json:"isLikedByCurrentUser,omitempty"`
}
