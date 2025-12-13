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

type TripMemberHandler struct {
	tripService         *services.TripService
	notificationService *services.NotificationService
	tracer              trace.Tracer
}

func NewTripMemberHandler(notificationService *services.NotificationService) *TripMemberHandler {
	return &TripMemberHandler{
		tripService:         services.NewTripService(),
		notificationService: notificationService,
		tracer:              otel.Tracer("trip-member-handler"),
	}
}

// GetTripMembers handles GET /api/v1/trips/:id/members
func (h *TripMemberHandler) GetTripMembers(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripMemberHandler.GetTripMembers")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	if tripID == "" {
		logger.Warn("Trip ID is required")
		BadRequest(c, "Trip ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	members, err := h.tripService.GetTripMembers(ctx, tripID)
	if err != nil {
		logger.Error(err)
		if err.Error() == "trip not found" {
			NotFound(c, err.Error())
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(members),
	})
	Success(c, http.StatusOK, gin.H{"members": members})
}

// AddTripMember handles POST /api/v1/trips/:id/members
func (h *TripMemberHandler) AddTripMember(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripMemberHandler.AddTripMember")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	if tripID == "" {
		logger.Warn("Trip ID is required")
		BadRequest(c, "Trip ID is required")
		return
	}

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	var req schemas.AddTripMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":  tripID,
		"userID":  userID,
		"request": req,
	})

	member, err := h.tripService.AddTripMember(ctx, tripID, userID, &req)
	if err != nil {
		logger.Error(err)
		if err.Error() == "trip not found" {
			NotFound(c, err.Error())
			return
		}
		if err.Error() == "unauthorized: only owner can add members" {
			Forbidden(c, err.Error())
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	// Send notification to the added member
	go func() {
		h.notificationService.CreateNotification(
			context.Background(),
			req.UserID,
			userID,
			tripID,
			models.NotificationTypeTripInvite,
			"added you to a trip",
		)
	}()

	logger.Output(member)
	Success(c, http.StatusCreated, member)
}

// UpdateTripMember handles PATCH /api/v1/trips/:id/members/:memberId
func (h *TripMemberHandler) UpdateTripMember(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripMemberHandler.UpdateTripMember")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	memberID := c.Param("memberId")
	if tripID == "" || memberID == "" {
		logger.Warn("Trip ID and Member ID are required")
		BadRequest(c, "Trip ID and Member ID are required")
		return
	}

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	var req schemas.UpdateTripMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":   tripID,
		"memberID": memberID,
		"userID":   userID,
		"request":  req,
	})

	member, err := h.tripService.UpdateTripMember(ctx, tripID, memberID, userID, &req)
	if err != nil {
		logger.Error(err)
		if err.Error() == "trip not found" || err.Error() == "member not found" {
			NotFound(c, err.Error())
			return
		}
		if err.Error() == "unauthorized: only owner can update members" {
			Forbidden(c, err.Error())
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(member)
	Success(c, http.StatusOK, member)
}

// DeleteTripMember handles DELETE /api/v1/trips/:id/members/:memberId
func (h *TripMemberHandler) DeleteTripMember(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripMemberHandler.DeleteTripMember")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	memberID := c.Param("memberId")
	if tripID == "" || memberID == "" {
		logger.Warn("Trip ID and Member ID are required")
		BadRequest(c, "Trip ID and Member ID are required")
		return
	}

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":   tripID,
		"memberID": memberID,
		"userID":   userID,
	})

	err := h.tripService.DeleteTripMember(ctx, tripID, memberID, userID)
	if err != nil {
		logger.Error(err)
		if err.Error() == "trip not found" || err.Error() == "member not found" {
			NotFound(c, err.Error())
			return
		}
		if err.Error() == "unauthorized: only owner can remove members" {
			Forbidden(c, err.Error())
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Info("Member removed successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "Member removed successfully",
		"id":      memberID,
	})
}

// RegisterRoutes registers trip member routes
func (h *TripMemberHandler) RegisterRoutes(trips *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	// All member routes require authentication
	authenticated := trips.Group("/members")
	authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		authenticated.GET("", h.GetTripMembers)
		authenticated.POST("", h.AddTripMember)
		authenticated.PATCH("/:memberId", h.UpdateTripMember)
		authenticated.DELETE("/:memberId", h.DeleteTripMember)
	}
}
