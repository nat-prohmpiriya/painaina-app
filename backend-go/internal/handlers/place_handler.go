package handlers

import (
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/internal/schemas"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type PlaceHandler struct {
	placeService *services.PlaceService
	redisService *services.RedisService
	tracer       trace.Tracer
}

func NewPlaceHandler(cfg *config.GoogleConfig, cityService *services.InMemoryCityService, redisService *services.RedisService) *PlaceHandler {
	return &PlaceHandler{
		placeService: services.NewPlaceService(cfg, cityService),
		redisService: redisService,
		tracer:       otel.Tracer("place-handler"),
	}
}

// Autocomplete handles place autocomplete
// GET /api/v1/places/autocomplete?input=bangkok&types=
func (h *PlaceHandler) Autocomplete(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.Autocomplete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.AutocompleteRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"input": req.Input,
		"types": req.Types,
	})

	result, err := h.placeService.Autocomplete(ctx, req.Input, req.Types)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(result)
	Success(c, http.StatusOK, result)
}

// AutocompleteCity handles city autocomplete
// GET /api/v1/places/autocomplete-city?input=bang
func (h *PlaceHandler) AutocompleteCity(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.AutocompleteCity")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.AutocompleteRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"input": req.Input,
	})

	result, err := h.placeService.AutocompleteCity(ctx, req.Input)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(result)
	Success(c, http.StatusOK, result)
}

// SearchPlaces handles place search
// GET /api/v1/places/search?query=restaurants+in+bangkok
func (h *PlaceHandler) SearchPlaces(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.SearchPlaces")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.SearchPlacesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"query": req.Query,
	})

	places, err := h.placeService.SearchPlaces(ctx, req.Query)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(places),
	})
	Success(c, http.StatusOK, places)
}


// GetReview handles getting Google reviews for a place
// GET /api/v1/places/review?placeId=xxx
func (h *PlaceHandler) GetReview(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.GetReview")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	placeID := c.Query("placeId")
	if placeID == "" {
		logger.Warn("placeId is required")
		BadRequest(c, "placeId is required")
		return
	}

	logger.Input(map[string]interface{}{
		"placeId": placeID,
	})

	reviews, err := h.placeService.GetReviews(ctx, placeID)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(reviews),
	})
	Success(c, http.StatusOK, gin.H{"reviews": reviews})
}

// GetPlace handles getting place details by ID
// GET /api/v1/places/:id
func (h *PlaceHandler) GetPlace(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.GetPlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	id := c.Param("id")
	if id == "" {
		logger.Warn("Place ID is required")
		BadRequest(c, "Place ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"id":     id,
		"idType": map[bool]string{true: "MongoDB", false: "Google"}[len(id) == 24],
	})

	// Check if ID is Google Place ID or MongoDB ID
	var place *models.Place
	var err error

	// Try as MongoDB ID first (24 hex characters)
	if len(id) == 24 {
		place, err = h.placeService.GetPlaceByID(ctx, id)
	} else {
		// Otherwise treat as Google Place ID
		place, err = h.placeService.GetPlaceByGoogleID(ctx, id)
	}

	if err != nil {
		logger.Error(err)
		NotFound(c, "Place not found")
		return
	}

	logger.Output(place)
	Success(c, http.StatusOK, place)
}

// ListPlaces handles listing places with pagination
// GET /api/v1/places?limit=20&offset=0
func (h *PlaceHandler) ListPlaces(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.ListPlaces")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.ListPlacesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	if req.Limit == 0 {
		req.Limit = 20
	}

	logger.Input(map[string]interface{}{
		"limit":  req.Limit,
		"offset": req.Offset,
	})

	places, err := h.placeService.ListPlaces(ctx, req.Limit, req.Offset)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(places),
	})
	Success(c, http.StatusOK, places)
}

// CreatePlace handles manual place creation (admin only)
// POST /api/v1/places
func (h *PlaceHandler) CreatePlace(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.CreatePlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

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

	var req schemas.CreatePlaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"adminUserId": user.ID.Hex(),
		"name":        req.Name,
		"googleId":    req.GooglePlaceID,
	})

	// Create place model
	place := &models.Place{
		GooglePlaceID: req.GooglePlaceID,
		Name:          req.Name,
		Address:       req.Address,
		Location: models.GeoPoint{
			Type:        "Point",
			Coordinates: []float64{req.Longitude, req.Latitude},
			Latitude:    req.Latitude,
			Longitude:   req.Longitude,
		},
		Phone:      req.Phone,
		Website:    req.Website,
		Categories: req.Categories,
	}

	if err := h.placeService.CreatePlace(ctx, place); err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"placeId": place.ID.Hex(),
	})
	Success(c, http.StatusCreated, place)
}

// UpdatePlace handles updating place (admin only)
// PATCH /api/v1/places/:id
func (h *PlaceHandler) UpdatePlace(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.UpdatePlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

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

	id := c.Param("id")
	if id == "" {
		logger.Warn("Place ID is required")
		BadRequest(c, "Place ID is required")
		return
	}

	// Get existing place
	place, err := h.placeService.GetPlaceByID(ctx, id)
	if err != nil {
		logger.Error(err)
		NotFound(c, "Place not found")
		return
	}

	var req schemas.UpdatePlaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"adminUserId": user.ID.Hex(),
		"placeId":     id,
		"request":     req,
	})

	// Update fields
	if req.Name != nil {
		place.Name = *req.Name
	}
	if req.Address != nil {
		place.Address = *req.Address
	}
	if req.Latitude != nil && req.Longitude != nil {
		place.Location = models.GeoPoint{
			Type:        "Point",
			Coordinates: []float64{*req.Longitude, *req.Latitude},
			Latitude:    *req.Latitude,
			Longitude:   *req.Longitude,
		}
	}
	if req.Phone != nil {
		place.Phone = req.Phone
	}
	if req.Website != nil {
		place.Website = req.Website
	}
	if req.Categories != nil {
		place.Categories = req.Categories
	}

	if err := h.placeService.UpdatePlace(ctx, place); err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(place)
	Success(c, http.StatusOK, place)
}

// DeletePlace handles deleting place (admin only)
// DELETE /api/v1/places/:id
func (h *PlaceHandler) DeletePlace(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.DeletePlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

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

	id := c.Param("id")
	if id == "" {
		logger.Warn("Place ID is required")
		BadRequest(c, "Place ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"adminUserId": user.ID.Hex(),
		"placeId":     id,
	})

	if err := h.placeService.DeletePlace(ctx, id); err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Info("Place deleted successfully")
	Success(c, http.StatusOK, gin.H{"message": "Place deleted successfully"})
}

// RegisterRoutes registers place routes
func (h *PlaceHandler) RegisterRoutes(v1 *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string, commentHandler *CommentHandler) {
	places := v1.Group("/places")
	{
		// Public routes
		places.GET("/autocomplete", h.Autocomplete)
		places.GET("/autocomplete-city", h.AutocompleteCity)
		places.GET("/search", h.SearchPlaces)
		places.GET("/photo", h.GetPhoto) // Single photo proxy with cache
		places.GET("/review", h.GetReview)
		places.GET("/:id", h.GetPlace)
		places.GET("", h.ListPlaces)

		// Authenticated routes (admin only)
		authenticated := places.Group("")
		authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
		{
			authenticated.POST("", h.CreatePlace)
			authenticated.PATCH("/:id", h.UpdatePlace)
			authenticated.DELETE("/:id", h.DeletePlace)
		}

		// Comment routes
		if commentHandler != nil {
			commentHandler.RegisterPlaceCommentRoutes(places, clerkSecretKey, clerkJWTIssuerDomain)
		}
	}
}

// GetPhoto handles getting a single photo by reference with caching
// GET /api/v1/places/photo?photoReference=xxx&maxWidth=400
func (h *PlaceHandler) GetPhoto(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PlaceHandler.GetPhoto")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	photoReference := c.Query("photoReference")
	maxWidth := c.DefaultQuery("maxWidth", "400")

	if photoReference == "" {
		logger.Error(fmt.Errorf("photoReference is required"))
		BadRequest(c, "photoReference is required")
		return
	}

	logger.Input(map[string]interface{}{
		"photoReference": photoReference,
		"maxWidth":       maxWidth,
	})

	// Generate cache key
	cacheKey := fmt.Sprintf("photo:%s:%s", photoReference, maxWidth)

	// Try to get from cache
	if h.redisService != nil {
		cachedPhoto, err := h.redisService.Get(ctx, cacheKey)
		if err != nil {
			logger.Error(fmt.Errorf("redis get error: %w", err))
		} else if cachedPhoto != nil {
			logger.Output("Photo served from cache")
			c.Header("Content-Type", "image/jpeg")
			c.Header("Cache-Control", "public, max-age=2592000") // 30 days
			c.Data(http.StatusOK, "image/jpeg", cachedPhoto)
			return
		}
	}

	// Cache miss - fetch from Google
	// Convert maxWidth string to int
	maxWidthInt := 400
	if maxWidth != "" {
		if width, err := strconv.Atoi(maxWidth); err == nil && width > 0 {
			maxWidthInt = width
		}
	}
	photoURL := h.placeService.GetPhotoURL(photoReference, maxWidthInt)

	// Fetch the photo
	resp, err := http.Get(photoURL)
	if err != nil {
		logger.Error(fmt.Errorf("failed to fetch photo: %w", err))
		InternalServerError(c, "Failed to fetch photo")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Error(fmt.Errorf("google API returned status %d", resp.StatusCode))
		c.Status(resp.StatusCode)
		return
	}

	// Read photo data
	photoData, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Error(fmt.Errorf("failed to read photo data: %w", err))
		InternalServerError(c, "Failed to read photo")
		return
	}

	// Cache the photo for 30 days (Google ToS compliant)
	if h.redisService != nil {
		err = h.redisService.Set(ctx, cacheKey, photoData, 30*24*time.Hour)
		if err != nil {
			logger.Error(fmt.Errorf("redis set error: %w", err))
			// Continue even if cache fails
		} else {
			logger.Output("Photo cached successfully")
		}
	}

	// Return the photo
	c.Header("Content-Type", "image/jpeg")
	c.Header("Cache-Control", "public, max-age=2592000") // 30 days
	c.Data(http.StatusOK, "image/jpeg", photoData)
}
