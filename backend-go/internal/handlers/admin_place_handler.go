package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/config"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type AdminPlaceHandler struct {
	adminService *services.AdminService
	placeService *services.PlaceService
	tracer       trace.Tracer
}

func NewAdminPlaceHandler(db *mongo.Database, cfg *config.GoogleConfig, cityService *services.InMemoryCityService) *AdminPlaceHandler {
	return &AdminPlaceHandler{
		adminService: services.NewAdminService(db),
		placeService: services.NewPlaceService(cfg, cityService),
		tracer:       otel.Tracer("admin-place-handler"),
	}
}

// ListCachedPlaces handles GET /api/v1/admin/places/cache
// Returns paginated list of cached places
// Query params: ?search=tokyo&page=1&limit=20
func (h *AdminPlaceHandler) ListCachedPlaces(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminPlaceHandler.ListCachedPlaces")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Parse query parameters
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := services.PlaceCacheFilter{
		Search: search,
		Page:   page,
		Limit:  limit,
	}

	logger.Input(filter)

	places, err := h.adminService.GetPlaceCacheList(ctx, filter)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get place cache list: "+err.Error())
		return
	}

	logger.Output(places)
	Success(c, http.StatusOK, places)
}

// GetCacheStats handles GET /api/v1/admin/places/cache/stats
// Returns cache statistics
func (h *AdminPlaceHandler) GetCacheStats(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminPlaceHandler.GetCacheStats")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	stats, err := h.adminService.GetPlaceCacheStats(ctx)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get cache stats: "+err.Error())
		return
	}

	logger.Output(stats)
	Success(c, http.StatusOK, stats)
}

// ClearExpiredCache handles POST /api/v1/admin/places/cache/clear-expired
// Clears expired cache entries (older than 30 days)
func (h *AdminPlaceHandler) ClearExpiredCache(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminPlaceHandler.ClearExpiredCache")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	deletedCount, err := h.placeService.CleanupExpiredCache(ctx)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to clear expired cache: "+err.Error())
		return
	}

	logger.Output(map[string]interface{}{"deletedCount": deletedCount})
	Success(c, http.StatusOK, gin.H{
		"message":      "Expired cache cleared successfully",
		"deletedCount": deletedCount,
	})
}

// RefreshPlace handles POST /api/v1/admin/places/cache/:id/refresh
// Force refreshes cache for a specific place
func (h *AdminPlaceHandler) RefreshPlace(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminPlaceHandler.RefreshPlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	googlePlaceID := c.Param("id")

	logger.Input(map[string]interface{}{"googlePlaceID": googlePlaceID})

	place, err := h.placeService.RefreshCache(ctx, googlePlaceID)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to refresh place cache: "+err.Error())
		return
	}

	logger.Output(place)
	Success(c, http.StatusOK, gin.H{
		"message": "Place cache refreshed successfully",
		"place":   place,
	})
}

// DeleteCachedPlace handles DELETE /api/v1/admin/places/cache/:id
// Deletes a cached place
func (h *AdminPlaceHandler) DeleteCachedPlace(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminPlaceHandler.DeleteCachedPlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	placeID := c.Param("id")

	logger.Input(map[string]interface{}{"placeID": placeID})

	err := h.placeService.DeletePlace(ctx, placeID)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to delete cached place: "+err.Error())
		return
	}

	logger.Output("Place cache deleted successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "Place cache deleted successfully",
	})
}
