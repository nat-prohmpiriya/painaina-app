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

type AdminTripHandler struct {
	adminService *services.AdminService
	tracer       trace.Tracer
}

func NewAdminTripHandler(db *mongo.Database) *AdminTripHandler {
	return &AdminTripHandler{
		adminService: services.NewAdminService(db),
		tracer:       otel.Tracer("admin-trip-handler"),
	}
}

// ListTrips handles GET /api/v1/admin/trips
// Returns paginated list of trips with filters
// Query params: ?search=tokyo&visibility=public&creatorId=xxx&type=guide&status=published&page=1&limit=20
func (h *AdminTripHandler) ListTrips(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminTripHandler.ListTrips")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Parse query parameters
	search := c.Query("search")
	visibility := c.Query("visibility")
	creatorID := c.Query("creatorId")
	tripType := c.Query("type")
	status := c.Query("status")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := services.TripListFilter{
		Search:     search,
		Visibility: visibility,
		CreatorID:  creatorID,
		Type:       tripType,
		Status:     status,
		Page:       page,
		Limit:      limit,
	}

	logger.Input(filter)

	trips, err := h.adminService.GetTripList(ctx, filter)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get trip list: "+err.Error())
		return
	}

	logger.Output(trips)
	Success(c, http.StatusOK, trips)
}

// DeleteTrip handles DELETE /api/v1/admin/trips/:id
// Deletes a trip (admin action)
func (h *AdminTripHandler) DeleteTrip(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminTripHandler.DeleteTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	// Get admin user ID
	adminID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("Admin not authenticated")
		Unauthorized(c, "Admin not authenticated")
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":  tripID,
		"adminID": adminID,
	})

	err := h.adminService.DeleteTrip(ctx, tripID, adminID)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to delete trip: "+err.Error())
		return
	}

	logger.Output("Trip deleted successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "Trip deleted successfully",
	})
}
