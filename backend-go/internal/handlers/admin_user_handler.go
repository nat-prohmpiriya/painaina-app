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

type AdminUserHandler struct {
	adminService *services.AdminService
	tracer       trace.Tracer
}

func NewAdminUserHandler(db *mongo.Database) *AdminUserHandler {
	return &AdminUserHandler{
		adminService: services.NewAdminService(db),
		tracer:       otel.Tracer("admin-user-handler"),
	}
}

// ListUsers handles GET /api/v1/admin/users
// Returns paginated list of users with filters
// Query params: ?search=john&role=admin&status=active&page=1&limit=20
func (h *AdminUserHandler) ListUsers(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminUserHandler.ListUsers")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Parse query parameters
	search := c.Query("search")
	role := c.Query("role")
	status := c.Query("status")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := services.UserListFilter{
		Search: search,
		Role:   role,
		Status: status,
		Page:   page,
		Limit:  limit,
	}

	logger.Input(filter)

	users, err := h.adminService.GetUserList(ctx, filter)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get user list: "+err.Error())
		return
	}

	logger.Output(users)
	Success(c, http.StatusOK, users)
}

// BanUserRequest represents the request body for banning a user
type BanUserRequest struct {
	Reason   string `json:"reason" binding:"required"`
	Duration *int   `json:"duration"` // Days (null = permanent)
}

// BanUser handles PUT /api/v1/admin/users/:id/ban
// Bans a user
func (h *AdminUserHandler) BanUser(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminUserHandler.BanUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID := c.Param("id")

	// Get admin user ID
	adminID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("Admin not authenticated")
		Unauthorized(c, "Admin not authenticated")
		return
	}

	// Parse request body
	var req BanUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"userID":   userID,
		"adminID":  adminID,
		"reason":   req.Reason,
		"duration": req.Duration,
	})

	err := h.adminService.BanUser(ctx, userID, adminID, req.Reason, req.Duration)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to ban user: "+err.Error())
		return
	}

	logger.Output("User banned successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "User banned successfully",
	})
}

// UnbanUser handles PUT /api/v1/admin/users/:id/unban
// Unbans a user
func (h *AdminUserHandler) UnbanUser(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminUserHandler.UnbanUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID := c.Param("id")

	// Get admin user ID
	adminID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("Admin not authenticated")
		Unauthorized(c, "Admin not authenticated")
		return
	}

	logger.Input(map[string]interface{}{
		"userID":  userID,
		"adminID": adminID,
	})

	err := h.adminService.UnbanUser(ctx, userID, adminID)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to unban user: "+err.Error())
		return
	}

	logger.Output("User unbanned successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "User unbanned successfully",
	})
}
