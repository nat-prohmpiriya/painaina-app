package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/middleware"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type AdminCommentHandler struct {
	adminService   *services.AdminService
	commentService *services.CommentService
	tracer         trace.Tracer
}

func NewAdminCommentHandler(db *mongo.Database) *AdminCommentHandler {
	return &AdminCommentHandler{
		adminService:   services.NewAdminService(db),
		commentService: services.NewCommentService(),
		tracer:         otel.Tracer("admin-comment-handler"),
	}
}

// ListComments handles GET /api/v1/admin/comments
// Returns paginated list of comments with filters
// Query params: ?search=text&targetType=trip&userId=xxx&page=1&limit=20
func (h *AdminCommentHandler) ListComments(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminCommentHandler.ListComments")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Parse query parameters
	search := c.Query("search")
	targetType := c.Query("targetType")
	userID := c.Query("userId")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := services.CommentListFilter{
		Search:     search,
		TargetType: targetType,
		UserID:     userID,
		Page:       page,
		Limit:      limit,
	}

	logger.Input(filter)

	comments, err := h.adminService.GetCommentList(ctx, filter)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get comment list: "+err.Error())
		return
	}

	logger.Output(comments)
	Success(c, http.StatusOK, comments)
}

// DeleteComment handles DELETE /api/v1/admin/comments/:id
// Hard deletes a comment (admin action)
func (h *AdminCommentHandler) DeleteComment(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminCommentHandler.DeleteComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	commentID := c.Param("id")

	// Get admin user ID
	adminID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("Admin not authenticated")
		Unauthorized(c, "Admin not authenticated")
		return
	}

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"adminID":   adminID,
	})

	// Use soft delete with isAdmin flag
	err := h.commentService.DeleteComment(ctx, commentID, adminID, true)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to delete comment: "+err.Error())
		return
	}

	logger.Output("Comment deleted successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "Comment deleted successfully",
	})
}
