package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/internal/schemas"
	"backend-go/internal/services"
)

type CheckInHandler struct {
	service *services.CheckInService
}

func NewCheckInHandler(service *services.CheckInService) *CheckInHandler {
	return &CheckInHandler{service: service}
}

// CreateCheckIn godoc
// @Summary Create a new check-in
// @Description Create a check-in for a visited city
// @Tags checkins
// @Accept json
// @Produce json
// @Param request body schemas.CreateCheckInRequest true "Check-in data"
// @Success 201 {object} schemas.CheckInResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /checkins [post]
func (h *CheckInHandler) CreateCheckIn(c *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		Unauthorized(c, "Unauthorized")
		return
	}

	var req schemas.CreateCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, err.Error())
		return
	}

	checkIn, err := h.service.CreateCheckIn(c.Request.Context(), userID, &req)
	if err != nil {
		BadRequest(c, err.Error())
		return
	}

	Success(c, http.StatusCreated, toCheckInResponse(checkIn))
}

// GetCheckIn godoc
// @Summary Get a check-in by ID
// @Description Get details of a specific check-in
// @Tags checkins
// @Accept json
// @Produce json
// @Param id path string true "Check-in ID"
// @Success 200 {object} schemas.CheckInResponse
// @Failure 404 {object} ErrorResponse
// @Router /checkins/{id} [get]
func (h *CheckInHandler) GetCheckIn(c *gin.Context) {
	id := c.Param("id")

	checkIn, err := h.service.GetCheckIn(c.Request.Context(), id)
	if err != nil {
		NotFound(c, "Check-in not found")
		return
	}

	Success(c, http.StatusOK, toCheckInResponse(checkIn))
}

// GetUserCheckIns godoc
// @Summary Get user's check-ins
// @Description Get all check-ins for a specific user with stats
// @Tags checkins
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} schemas.CheckInListResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{userId}/checkins [get]
func (h *CheckInHandler) GetUserCheckIns(c *gin.Context) {
	userID := c.Param("userId")

	checkIns, stats, err := h.service.GetUserCheckInsWithStats(c.Request.Context(), userID)
	if err != nil {
		InternalServerError(c, err.Error())
		return
	}

	response := schemas.CheckInListResponse{
		CheckIns: make([]schemas.CheckInResponse, len(checkIns)),
		Stats: schemas.CheckInStatsResponse{
			TotalCountries: stats.TotalCountries,
			TotalCities:    stats.TotalCities,
			Countries:      make([]schemas.CountryStatResponse, len(stats.Countries)),
		},
	}

	for i, ci := range checkIns {
		response.CheckIns[i] = *toCheckInResponse(ci)
	}

	for i, cs := range stats.Countries {
		response.Stats.Countries[i] = schemas.CountryStatResponse{
			CountryCode: cs.CountryCode,
			Country:     cs.Country,
			Flag:        cs.Flag,
			CitiesCount: cs.CitiesCount,
		}
	}

	Success(c, http.StatusOK, response)
}

// GetUserCheckInStats godoc
// @Summary Get user's check-in statistics
// @Description Get check-in statistics for a specific user
// @Tags checkins
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} schemas.CheckInStatsResponse
// @Failure 500 {object} ErrorResponse
// @Router /users/{userId}/checkins/stats [get]
func (h *CheckInHandler) GetUserCheckInStats(c *gin.Context) {
	userID := c.Param("userId")

	stats, err := h.service.GetUserStats(c.Request.Context(), userID)
	if err != nil {
		InternalServerError(c, err.Error())
		return
	}

	response := schemas.CheckInStatsResponse{
		TotalCountries: stats.TotalCountries,
		TotalCities:    stats.TotalCities,
		Countries:      make([]schemas.CountryStatResponse, len(stats.Countries)),
	}

	for i, cs := range stats.Countries {
		response.Countries[i] = schemas.CountryStatResponse{
			CountryCode: cs.CountryCode,
			Country:     cs.Country,
			Flag:        cs.Flag,
			CitiesCount: cs.CitiesCount,
		}
	}

	Success(c, http.StatusOK, response)
}

// UpdateCheckIn godoc
// @Summary Update a check-in
// @Description Update an existing check-in
// @Tags checkins
// @Accept json
// @Produce json
// @Param id path string true "Check-in ID"
// @Param request body schemas.UpdateCheckInRequest true "Update data"
// @Success 200 {object} schemas.CheckInResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /checkins/{id} [put]
func (h *CheckInHandler) UpdateCheckIn(c *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		Unauthorized(c, "Unauthorized")
		return
	}

	id := c.Param("id")

	var req schemas.UpdateCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, err.Error())
		return
	}

	checkIn, err := h.service.UpdateCheckIn(c.Request.Context(), id, userID, &req)
	if err != nil {
		if err.Error() == "unauthorized: you can only update your own check-ins" {
			Forbidden(c, err.Error())
			return
		}
		BadRequest(c, err.Error())
		return
	}

	Success(c, http.StatusOK, toCheckInResponse(checkIn))
}

// DeleteCheckIn godoc
// @Summary Delete a check-in
// @Description Delete an existing check-in
// @Tags checkins
// @Accept json
// @Produce json
// @Param id path string true "Check-in ID"
// @Success 204
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /checkins/{id} [delete]
func (h *CheckInHandler) DeleteCheckIn(c *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		Unauthorized(c, "Unauthorized")
		return
	}

	id := c.Param("id")

	err := h.service.DeleteCheckIn(c.Request.Context(), id, userID)
	if err != nil {
		if err.Error() == "unauthorized: you can only delete your own check-ins" {
			Forbidden(c, err.Error())
			return
		}
		NotFound(c, "Check-in not found")
		return
	}

	c.Status(http.StatusNoContent)
}

// Helper function to convert model to response
func toCheckInResponse(ci *models.CheckIn) *schemas.CheckInResponse {
	return &schemas.CheckInResponse{
		ID:          ci.ID.Hex(),
		UserID:      ci.UserID,
		CountryCode: ci.CountryCode,
		Country:     ci.Country,
		CountryFlag: ci.CountryFlag,
		RegionID:    ci.RegionID,
		Region:      ci.Region,
		CityID:      ci.CityID,
		City:        ci.City,
		Latitude:    ci.Location.Latitude,
		Longitude:   ci.Location.Longitude,
		VisitedAt:   ci.VisitedAt,
		Note:        ci.Note,
		Photos:      ci.Photos,
		TripID:      ci.TripID,
		CreatedAt:   ci.CreatedAt,
		UpdatedAt:   ci.UpdatedAt,
	}
}
