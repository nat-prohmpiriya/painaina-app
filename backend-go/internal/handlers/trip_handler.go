package handlers

import (
	"net/http"

	"backend-go/internal/middleware"
	"backend-go/internal/schemas"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type TripHandler struct {
	tripService         *services.TripService
	expenseService      *services.ExpenseService
	itineraryService    *services.ItineraryService
	notificationService *services.NotificationService
	tracer              trace.Tracer
}

func NewTripHandler(notificationService *services.NotificationService) *TripHandler {
	return &TripHandler{
		tripService:         services.NewTripService(),
		expenseService:      services.NewExpenseService(),
		itineraryService:    services.NewItineraryService(),
		notificationService: notificationService,
		tracer:              otel.Tracer("trip-handler"),
	}
}

func (h *TripHandler) CreateTrip(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripHandler.CreateTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	var req schemas.CreateTripRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"userID": userID,
		"title":  req.Title,
	})

	trip, err := h.tripService.CreateTrip(ctx, userID, &req)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"tripID": trip.ID.Hex(),
	})
	Success(c, http.StatusCreated, trip)
}

func (h *TripHandler) GetTrip(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripHandler.GetTrip")
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

	// Use aggregation to get all data in 1 query (trip + itineraries + entries + expenses + users)
	data, err := h.tripService.GetTripWithFullData(ctx, tripID)
	if err != nil {
		logger.Error(err)
		NotFound(c, "Trip not found")
		return
	}

	logger.Output(data)
	Success(c, http.StatusOK, data)
}

func (h *TripHandler) ListTrips(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripHandler.ListTrips")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var query schemas.ListTripsQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		logger.Error(err)
		BadRequest(c, "Invalid query parameters: "+err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"limit":  query.Limit,
		"offset": query.Offset,
	})

	trips, err := h.tripService.ListTrips(ctx, &query)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(trips),
	})
	Success(c, http.StatusOK, gin.H{
		"trips": trips,
		"meta": gin.H{
			"limit":  query.Limit,
			"offset": query.Offset,
			"total":  len(trips),
		},
	})
}

func (h *TripHandler) UpdateTrip(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripHandler.UpdateTrip")
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

	var req schemas.UpdateTripRequest
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

	trip, err := h.tripService.UpdateTrip(ctx, tripID, userID, &req)
	if err != nil {
		logger.Error(err)
		if err.Error() == "trip not found" {
			NotFound(c, err.Error())
			return
		}
		if err.Error() == "unauthorized: you don't own this trip" {
			Forbidden(c, err.Error())
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(trip)
	Success(c, http.StatusOK, trip)
}

func (h *TripHandler) DeleteTrip(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "TripHandler.DeleteTrip")
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

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"userID": userID,
	})

	err := h.tripService.DeleteTrip(ctx, tripID, userID)
	if err != nil {
		logger.Error(err)
		if err.Error() == "trip not found" {
			NotFound(c, err.Error())
			return
		}
		if err.Error() == "unauthorized: you don't own this trip" {
			Forbidden(c, err.Error())
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Info("Trip deleted successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "Trip deleted successfully",
		"id":      tripID,
	})
}

// RegisterRoutes registers trip routes
func (h *TripHandler) RegisterRoutes(trips *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string, commentHandler *CommentHandler, expenseHandler *ExpenseHandler, itineraryHandler *ItineraryHandler) {
	// Public routes on /trips/:id
	trips.GET("", h.GetTrip)

	// Authenticated routes
	authenticated := trips.Group("")
	authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		authenticated.PATCH("", h.UpdateTrip)
		authenticated.DELETE("", h.DeleteTrip)
	}

	// Comment routes
	if commentHandler != nil {
		commentHandler.RegisterTripCommentRoutes(trips, clerkSecretKey, clerkJWTIssuerDomain)
	}

	// Member routes
	memberHandler := NewTripMemberHandler(h.notificationService)
	memberHandler.RegisterRoutes(trips, clerkSecretKey, clerkJWTIssuerDomain)
}
