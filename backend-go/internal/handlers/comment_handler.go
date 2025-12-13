package handlers

import (
	"context"
	"net/http"

	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/internal/schemas"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type CommentHandler struct {
	commentService      *services.CommentService
	notificationService *services.NotificationService
	tracer              trace.Tracer
}

func NewCommentHandler(notificationService *services.NotificationService) *CommentHandler {
	return &CommentHandler{
		commentService:      services.NewCommentService(),
		notificationService: notificationService,
		tracer:              otel.Tracer("comment-handler"),
	}
}

// GetComments gets comments for a target (trip or place)
// GET /api/v1/trips/:id/comments or /api/v1/places/:id/comments
func (h *CommentHandler) GetComments(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "CommentHandler.GetComments")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	targetID := c.Param("id")
	targetType := c.GetString("targetType") // Set by route handler

	if targetID == "" {
		logger.Warn("Target ID is required")
		BadRequest(c, "Target ID is required")
		return
	}

	var req schemas.ListCommentsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	if req.Limit == 0 {
		req.Limit = 20
	}

	logger.Input(map[string]interface{}{
		"targetID":   targetID,
		"targetType": targetType,
		"limit":      req.Limit,
		"offset":     req.Offset,
	})

	comments, err := h.commentService.GetCommentsByTarget(ctx, targetID, targetType, req.Limit, req.Offset)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	// Map to response schema
	response := make([]*schemas.CommentResponse, len(comments))
	for i, comment := range comments {
		userInfo := &schemas.UserInfo{}
		if comment.User != nil {
			userInfo.ID = comment.User.ID.Hex()
			userInfo.Name = comment.User.Name
			userInfo.PhotoURL = &comment.User.PhotoURL
		}

		response[i] = &schemas.CommentResponse{
			ID:             comment.ID.Hex(),
			UserID:         comment.UserID.Hex(),
			TargetID:       comment.TargetID.Hex(),
			TargetType:     comment.TargetType,
			Content:        comment.Content,
			Photos:         comment.Photos,
			ReactionsCount: comment.ReactionsCount,
			RepliesCount:   comment.RepliesCount,
			IsEdited:       comment.IsEdited,
			CreatedAt:      comment.CreatedAt.Format("2006-01-02T15:04:05.000Z07:00"),
			UpdatedAt:      comment.UpdatedAt.Format("2006-01-02T15:04:05.000Z07:00"),
			User:           userInfo,
		}

		if comment.ParentID != nil {
			parentID := comment.ParentID.Hex()
			response[i].ParentID = &parentID
		}
	}

	logger.Output(map[string]interface{}{
		"count": len(response),
	})
	Success(c, http.StatusOK, response)
}

// GetReplies gets replies for a comment
// GET /api/v1/comments/:commentId/replies
func (h *CommentHandler) GetReplies(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "CommentHandler.GetReplies")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	commentID := c.Param("commentId")
	if commentID == "" {
		logger.Warn("Comment ID is required")
		BadRequest(c, "Comment ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"commentID": commentID,
	})

	replies, err := h.commentService.GetReplies(ctx, commentID)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	// Map to response schema
	response := make([]*schemas.CommentResponse, len(replies))
	for i, reply := range replies {
		userInfo := &schemas.UserInfo{}
		if reply.User != nil {
			userInfo.ID = reply.User.ID.Hex()
			userInfo.Name = reply.User.Name
			userInfo.PhotoURL = &reply.User.PhotoURL
		}

		response[i] = &schemas.CommentResponse{
			ID:             reply.ID.Hex(),
			UserID:         reply.UserID.Hex(),
			TargetID:       reply.TargetID.Hex(),
			TargetType:     reply.TargetType,
			Content:        reply.Content,
			Photos:         reply.Photos,
			ReactionsCount: reply.ReactionsCount,
			RepliesCount:   reply.RepliesCount,
			IsEdited:       reply.IsEdited,
			CreatedAt:      reply.CreatedAt.Format("2006-01-02T15:04:05.000Z07:00"),
			UpdatedAt:      reply.UpdatedAt.Format("2006-01-02T15:04:05.000Z07:00"),
			User:           userInfo,
		}

		if reply.ParentID != nil {
			parentID := reply.ParentID.Hex()
			response[i].ParentID = &parentID
		}
	}

	logger.Output(map[string]interface{}{
		"count": len(response),
	})
	Success(c, http.StatusOK, response)
}

// CreateComment creates a new comment
// POST /api/v1/trips/:id/comments or /api/v1/places/:id/comments
func (h *CommentHandler) CreateComment(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "CommentHandler.CreateComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	targetID := c.Param("id")
	targetType := c.GetString("targetType") // Set by route handler

	if targetID == "" {
		logger.Warn("Target ID is required")
		BadRequest(c, "Target ID is required")
		return
	}

	var req schemas.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"userID":     userID,
		"targetID":   targetID,
		"targetType": targetType,
		"content":    req.Content,
		"parentID":   req.ParentID,
	})

	comment, err := h.commentService.CreateComment(
		ctx,
		userID,
		targetID,
		targetType,
		req.Content,
		req.Photos,
		req.ParentID,
	)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	// Send notification
	go func() {
		if req.ParentID != nil && *req.ParentID != "" {
			// Reply to comment - notify the parent comment author
			parentComment, err := h.commentService.GetCommentByID(context.Background(), *req.ParentID)
			if err == nil && parentComment.UserID.Hex() != userID {
				h.notificationService.CreateNotification(
					context.Background(),
					parentComment.UserID.Hex(),
					userID,
					comment.ID.Hex(),
					models.NotificationTypeCommentReply,
					"replied to your comment",
				)
			}
		} else if targetType == "trip" {
			// Comment on trip - notify trip owner
			trip, err := h.commentService.GetTripByID(context.Background(), targetID)
			if err == nil && trip.OwnerID.Hex() != userID {
				h.notificationService.CreateNotification(
					context.Background(),
					trip.OwnerID.Hex(),
					userID,
					comment.ID.Hex(),
					models.NotificationTypeComment,
					"commented on your trip",
				)
			}
		}
	}()

	logger.Output(map[string]interface{}{
		"commentID": comment.ID.Hex(),
	})
	Success(c, http.StatusCreated, comment)
}

// UpdateComment updates a comment
// PATCH /api/v1/trips/:id/comments/:commentId or /api/v1/places/:id/comments/:commentId
func (h *CommentHandler) UpdateComment(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "CommentHandler.UpdateComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	commentID := c.Param("commentId")
	if commentID == "" {
		logger.Warn("Comment ID is required")
		BadRequest(c, "Comment ID is required")
		return
	}

	var req schemas.UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
		"request":   req,
	})

	comment, err := h.commentService.UpdateComment(
		ctx,
		commentID,
		userID,
		req.Content,
		req.Photos,
	)
	if err != nil {
		logger.Error(err)
		if err.Error() == "comment not found" {
			NotFound(c, "Comment not found")
			return
		}
		if err.Error() == "unauthorized: you don't own this comment" {
			Forbidden(c, "You don't have permission to update this comment")
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(comment)
	Success(c, http.StatusOK, comment)
}

// DeleteComment deletes a comment
// DELETE /api/v1/trips/:id/comments/:commentId or /api/v1/places/:id/comments/:commentId
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "CommentHandler.DeleteComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	user, _ := middleware.GetCurrentUser(c)
	isAdmin := user != nil && user.Role == models.UserRoleAdmin

	commentID := c.Param("commentId")
	if commentID == "" {
		logger.Warn("Comment ID is required")
		BadRequest(c, "Comment ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
		"isAdmin":   isAdmin,
	})

	err := h.commentService.DeleteComment(ctx, commentID, userID, isAdmin)
	if err != nil {
		logger.Error(err)
		if err.Error() == "comment not found" {
			NotFound(c, "Comment not found")
			return
		}
		if err.Error() == "unauthorized: you don't own this comment" {
			Forbidden(c, "You don't have permission to delete this comment")
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Info("Comment deleted successfully")
	Success(c, http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}

// LikeComment likes a comment
// POST /api/v1/comments/:commentId/like
func (h *CommentHandler) LikeComment(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "CommentHandler.LikeComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	commentID := c.Param("commentId")
	if commentID == "" {
		logger.Warn("Comment ID is required")
		BadRequest(c, "Comment ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
	})

	err := h.commentService.LikeComment(ctx, commentID, userID)
	if err != nil {
		logger.Error(err)
		if err.Error() == "comment not found" {
			NotFound(c, "Comment not found")
			return
		}
		if err.Error() == "already liked" {
			BadRequest(c, "Already liked this comment")
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	// Send notification to comment author
	go func() {
		comment, err := h.commentService.GetCommentByID(context.Background(), commentID)
		if err == nil && comment.UserID.Hex() != userID {
			h.notificationService.CreateNotification(
				context.Background(),
				comment.UserID.Hex(),
				userID,
				commentID,
				models.NotificationTypeLike,
				"liked your comment",
			)
		}
	}()

	logger.Info("Comment liked successfully")
	Success(c, http.StatusOK, gin.H{"message": "Comment liked successfully"})
}

// UnlikeComment unlikes a comment
// DELETE /api/v1/comments/:commentId/like
func (h *CommentHandler) UnlikeComment(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "CommentHandler.UnlikeComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	commentID := c.Param("commentId")
	if commentID == "" {
		logger.Warn("Comment ID is required")
		BadRequest(c, "Comment ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
	})

	err := h.commentService.UnlikeComment(ctx, commentID, userID)
	if err != nil {
		logger.Error(err)
		if err.Error() == "comment not found" {
			NotFound(c, "Comment not found")
			return
		}
		if err.Error() == "not liked" {
			BadRequest(c, "Comment not liked")
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Info("Comment unliked successfully")
	Success(c, http.StatusOK, gin.H{"message": "Comment unliked successfully"})
}

// RegisterTripCommentRoutes registers comment routes for trips
func (h *CommentHandler) RegisterTripCommentRoutes(trips *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	// Middleware to set target type
	setTargetType := func(c *gin.Context) {
		c.Set("targetType", models.CommentTargetTrip)
		c.Next()
	}

	trips.GET("/comments", setTargetType, h.GetComments)

	authenticated := trips.Group("")
	authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		authenticated.POST("/comments", setTargetType, h.CreateComment)
		authenticated.PATCH("/comments/:commentId", setTargetType, h.UpdateComment)
		authenticated.DELETE("/comments/:commentId", setTargetType, h.DeleteComment)
	}
}

// RegisterPlaceCommentRoutes registers comment routes for places
func (h *CommentHandler) RegisterPlaceCommentRoutes(places *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	// Middleware to set target type
	setTargetType := func(c *gin.Context) {
		c.Set("targetType", models.CommentTargetPlace)
		c.Next()
	}

	places.GET("/:id/comments", setTargetType, h.GetComments)

	authenticated := places.Group("")
	authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		authenticated.POST("/:id/comments", setTargetType, h.CreateComment)
		authenticated.PATCH("/:id/comments/:commentId", setTargetType, h.UpdateComment)
		authenticated.DELETE("/:id/comments/:commentId", setTargetType, h.DeleteComment)
	}
}

// RegisterCommentRoutes registers standalone comment routes (like/unlike)
func (h *CommentHandler) RegisterCommentRoutes(v1 *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	comments := v1.Group("/comments")
	{
		comments.GET("/:commentId/replies", h.GetReplies)

		authenticated := comments.Group("")
		authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
		{
			authenticated.POST("/:commentId/like", h.LikeComment)
			authenticated.DELETE("/:commentId/like", h.UnlikeComment)
		}
	}
}
