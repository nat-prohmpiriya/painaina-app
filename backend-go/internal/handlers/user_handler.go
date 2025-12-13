package handlers

import (
	"net/http"

	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type UserHandler struct {
	userService *services.UserService
	tracer      trace.Tracer
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userService: services.NewUserService(),
		tracer:      otel.Tracer("user-handler"),
	}
}

// UpdateUserRequest represents the request body for updating user profile
// Email is intentionally NOT included as it should be immutable
type UpdateUserRequest struct {
	Name     *string               `json:"name,omitempty"`
	Bio      *string               `json:"bio,omitempty"`
	PhotoURL *string               `json:"photoUrl,omitempty"`
	Settings *models.UserSettings  `json:"settings,omitempty"`
}

// GetMe handles GET /api/v1/users/me
func (h *UserHandler) GetMe(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.GetMe")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Get user from context (set by auth middleware with JIT sync)
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	logger.Output(user)
	Success(c, http.StatusOK, user)
}

// UpdateMe handles PATCH /api/v1/users/me
// Note: Email cannot be updated (immutable)
func (h *UserHandler) UpdateMe(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.UpdateMe")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Get user from context
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	// Parse request body
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"userID":  user.ID.Hex(),
		"request": req,
	})

	// Update user fields (only if provided)
	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Bio != nil {
		user.Bio = req.Bio
	}
	if req.PhotoURL != nil {
		user.PhotoURL = req.PhotoURL
	}
	if req.Settings != nil {
		user.Settings = req.Settings
	}

	// Update user via service
	if err := h.userService.UpdateUser(ctx, user); err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to update user: "+err.Error())
		return
	}

	logger.Output(user)
	Success(c, http.StatusOK, user)
}

// DeleteMe handles DELETE /api/v1/users/me
func (h *UserHandler) DeleteMe(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.DeleteMe")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	logger.Input(map[string]interface{}{
		"userID": userID,
	})

	// Delete user via service
	if err := h.userService.DeleteUser(ctx, userID); err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to delete user: "+err.Error())
		return
	}

	logger.Info("User deleted successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "User deleted successfully",
		"id":      userID,
	})
}

// GetUser handles GET /api/v1/users/:userId
func (h *UserHandler) GetUser(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.GetUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID := c.Param("userId")
	if userID == "" {
		logger.Warn("User ID is required")
		BadRequest(c, "User ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"userID": userID,
	})

	user, err := h.userService.GetUser(ctx, userID)
	if err != nil {
		logger.Error(err)
		NotFound(c, "User not found")
		return
	}

	logger.Output(user)
	Success(c, http.StatusOK, user)
}

// ListUsers handles GET /api/v1/users?limit=10 (admin only)
func (h *UserHandler) ListUsers(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.ListUsers")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Check if user is admin
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	if user.Role != models.UserRoleAdmin {
		logger.Warn("Admin access required")
		Forbidden(c, "Admin access required")
		return
	}

	// Parse query params
	limit := 10
	if l := c.Query("limit"); l != "" {
		if val := c.GetInt("limit"); val > 0 {
			limit = val
		}
	}

	logger.Input(map[string]interface{}{
		"limit": limit,
	})

	users, err := h.userService.ListUsers(ctx, limit)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to list users: "+err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(users),
	})

	Success(c, http.StatusOK, gin.H{
		"users": users,
		"meta": gin.H{
			"limit": limit,
			"total": len(users),
		},
	})
}

// UpdateUser handles PATCH /api/v1/users/:userId (admin only)
func (h *UserHandler) UpdateUser(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.UpdateUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Check if user is admin
	currentUser, exists := middleware.GetCurrentUser(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	if currentUser.Role != models.UserRoleAdmin {
		logger.Warn("Admin access required")
		Forbidden(c, "Admin access required")
		return
	}

	userID := c.Param("userId")
	if userID == "" {
		logger.Warn("User ID is required")
		BadRequest(c, "User ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"adminUserID": currentUser.ID.Hex(),
		"targetUserID": userID,
	})

	// Get target user
	user, err := h.userService.GetUser(ctx, userID)
	if err != nil {
		logger.Error(err)
		NotFound(c, "User not found")
		return
	}

	// Parse request body
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, "Invalid request body: "+err.Error())
		return
	}

	// Update user fields
	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Bio != nil {
		user.Bio = req.Bio
	}
	if req.PhotoURL != nil {
		user.PhotoURL = req.PhotoURL
	}
	if req.Settings != nil {
		user.Settings = req.Settings
	}

	// Update user via service
	if err := h.userService.UpdateUser(ctx, user); err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to update user: "+err.Error())
		return
	}

	logger.Output(user)
	Success(c, http.StatusOK, user)
}

// DeleteUser handles DELETE /api/v1/users/:userId (admin only)
func (h *UserHandler) DeleteUser(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.DeleteUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Check if user is admin
	user, exists := middleware.GetCurrentUser(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	if user.Role != models.UserRoleAdmin {
		logger.Warn("Admin access required")
		Forbidden(c, "Admin access required")
		return
	}

	userID := c.Param("userId")
	if userID == "" {
		logger.Warn("User ID is required")
		BadRequest(c, "User ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"adminUserID": user.ID.Hex(),
		"targetUserID": userID,
	})

	// Delete user via service
	if err := h.userService.DeleteUser(ctx, userID); err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to delete user: "+err.Error())
		return
	}

	logger.Info("User deleted successfully by admin")
	Success(c, http.StatusOK, gin.H{
		"message": "User deleted successfully",
		"id":      userID,
	})
}

// SearchUsers handles GET /api/v1/users/search?q=query
func (h *UserHandler) SearchUsers(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UserHandler.SearchUsers")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	query := c.Query("q")
	if query == "" {
		logger.Warn("Search query is required")
		BadRequest(c, "Search query is required")
		return
	}

	logger.Input(map[string]interface{}{
		"query": query,
	})

	users, err := h.userService.SearchUsers(ctx, query)
	if err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(users),
	})

	Success(c, http.StatusOK, gin.H{
		"users": users,
		"meta": gin.H{
			"query": query,
			"count": len(users),
		},
	})
}

// RegisterRoutes registers user routes
func (h *UserHandler) RegisterRoutes(v1 *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	users := v1.Group("/users")
	users.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		users.GET("/me", h.GetMe)
		users.PATCH("/me", h.UpdateMe)
		users.DELETE("/me", h.DeleteMe)

		// Search users (for trip member invitation)
		users.GET("/search", h.SearchUsers)

		// Admin routes
		users.GET("/:userId", h.GetUser)
		users.GET("", h.ListUsers)
		users.PATCH("/:userId", h.UpdateUser)
		users.DELETE("/:userId", h.DeleteUser)
	}
}
