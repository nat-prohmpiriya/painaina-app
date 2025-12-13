package handlers

import (
	"bytes"
	"io"
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

type ItineraryHandler struct {
	itineraryService *services.ItineraryService
	tracer           trace.Tracer
}

func NewItineraryHandler() *ItineraryHandler {
	return &ItineraryHandler{
		itineraryService: services.NewItineraryService(),
		tracer:           otel.Tracer("itinerary-handler"),
	}
}

// RegisterRoutes registers itinerary routes under /trips/:id
func (h *ItineraryHandler) RegisterRoutes(trips *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	// Public routes
	trips.GET("/itineraries", h.GetItinerariesByTripID)
	trips.GET("/itineraries/:itineraryId", h.GetItinerary)
	trips.GET("/itineraries/:itineraryId/entries", h.GetEntriesByItineraryID)
	trips.GET("/itineraries/:itineraryId/entries/:entryId", h.GetEntry)

	// Authenticated routes
	authenticated := trips.Group("")
	authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		// Itinerary routes
		authenticated.POST("/itineraries", h.CreateItinerary)
		authenticated.PATCH("/itineraries/:itineraryId", h.UpdateItinerary)
		authenticated.DELETE("/itineraries/:itineraryId", h.DeleteItinerary)
		authenticated.POST("/itineraries/:itineraryId/insert-after", h.InsertItineraryAfter)

		// Entry routes
		authenticated.POST("/itineraries/:itineraryId/entries", h.CreateEntry)
		authenticated.PATCH("/itineraries/:itineraryId/entries/:entryId", h.UpdateEntry)
		authenticated.DELETE("/itineraries/:itineraryId/entries/:entryId", h.DeleteEntry)

		// Todo routes
		authenticated.POST("/itineraries/:itineraryId/entries/:entryId/todos", h.CreateTodo)
		authenticated.PATCH("/itineraries/:itineraryId/entries/:entryId/todos/:todoId", h.UpdateTodo)
		authenticated.DELETE("/itineraries/:itineraryId/entries/:entryId/todos/:todoId", h.DeleteTodo)
		authenticated.POST("/itineraries/:itineraryId/entries/:entryId/todos/:todoId/toggle", h.ToggleTodo)
		authenticated.PATCH("/itineraries/:itineraryId/entries/:entryId/todos/reorder", h.ReorderTodos)

		// Reorder entries
		authenticated.PATCH("/itineraries/:itineraryId/entries/reorder", h.ReorderEntries)
	}
}

// GetItinerariesByTripID godoc
// @Summary Get all itineraries (days) for a trip
// @Tags itineraries
// @Param tripId path string true "Trip ID"
// @Success 200 {array} models.Itinerary
// @Router /trips/{tripId}/itineraries [get]
func (h *ItineraryHandler) GetItinerariesByTripID(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.GetItinerariesByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	logger.Input(map[string]interface{}{"tripID": tripID})

	itineraries, err := h.itineraryService.GetItinerariesByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{"count": len(itineraries)})
	c.JSON(http.StatusOK, itineraries)
}

// GetItinerary godoc
// @Summary Get a specific itinerary (day) by ID
// @Tags itineraries
// @Param id path string true "Itinerary ID"
// @Success 200 {object} models.Itinerary
// @Router /itineraries/{id} [get]
func (h *ItineraryHandler) GetItinerary(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.GetItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	itineraryID := c.Param("itineraryId")
	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	itinerary, err := h.itineraryService.GetItinerary(ctx, itineraryID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "itinerary not found"})
		return
	}

	logger.Output(itinerary)
	c.JSON(http.StatusOK, itinerary)
}

// CreateItinerary godoc
// @Summary Create a new itinerary (day) for a trip
// @Tags itineraries
// @Param tripId path string true "Trip ID"
// @Param itinerary body schemas.CreateItineraryRequest true "Itinerary data"
// @Success 201 {object} models.Itinerary
// @Router /trips/{tripId}/itineraries [post]
func (h *ItineraryHandler) CreateItinerary(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.CreateItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	var req schemas.CreateItineraryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":    tripID,
		"dayNumber": req.DayNumber,
		"title":     req.Title,
	})

	itinerary, err := h.itineraryService.CreateItinerary(
		ctx,
		tripID,
		req.DayNumber,
		req.Date,
		req.Title,
		req.Order,
	)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{"itineraryID": itinerary.ID.Hex()})
	c.JSON(http.StatusCreated, itinerary)
}

// UpdateItinerary godoc
// @Summary Update an itinerary (day)
// @Tags itineraries
// @Param id path string true "Itinerary ID"
// @Param itinerary body schemas.UpdateItineraryRequest true "Itinerary data"
// @Success 200 {object} models.Itinerary
// @Router /itineraries/{id} [patch]
func (h *ItineraryHandler) UpdateItinerary(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.UpdateItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	itineraryID := c.Param("itineraryId")

	var req schemas.UpdateItineraryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	itinerary, err := h.itineraryService.UpdateItinerary(
		ctx,
		itineraryID,
		req.Title,
		req.Date,
		req.Order,
	)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(itinerary)
	c.JSON(http.StatusOK, itinerary)
}

// DeleteItinerary godoc
// @Summary Delete an itinerary (day) and all its entries
// @Tags itineraries
// @Param id path string true "Itinerary ID"
// @Success 204
// @Router /itineraries/{id} [delete]
func (h *ItineraryHandler) DeleteItinerary(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.DeleteItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	itineraryID := c.Param("itineraryId")
	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	if err := h.itineraryService.DeleteItinerary(ctx, itineraryID); err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Itinerary deleted successfully")
	c.Status(http.StatusNoContent)
}

// GetEntriesByItineraryID godoc
// @Summary Get all entries for an itinerary (day)
// @Tags itinerary-entries
// @Param itineraryId path string true "Itinerary ID"
// @Success 200 {array} models.ItineraryEntry
// @Router /itineraries/{itineraryId}/entries [get]
func (h *ItineraryHandler) GetEntriesByItineraryID(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.GetEntriesByItineraryID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	itineraryID := c.Param("itineraryId")
	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	entries, err := h.itineraryService.GetEntriesByItineraryID(ctx, itineraryID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{"count": len(entries)})
	c.JSON(http.StatusOK, entries)
}

// GetEntry godoc
// @Summary Get a specific entry by ID
// @Tags itinerary-entries
// @Param id path string true "Entry ID"
// @Success 200 {object} models.ItineraryEntry
// @Router /entries/{id} [get]
func (h *ItineraryHandler) GetEntry(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.GetEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")
	logger.Input(map[string]interface{}{"entryID": entryID})

	entry, err := h.itineraryService.GetEntry(ctx, entryID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "entry not found"})
		return
	}

	logger.Output(entry)
	c.JSON(http.StatusOK, entry)
}

// CreateEntry godoc
// @Summary Create a new entry in an itinerary (day)
// @Tags itinerary-entries
// @Param itineraryId path string true "Itinerary ID"
// @Param entry body schemas.CreateEntryRequest true "Entry data"
// @Success 201 {object} models.ItineraryEntry
// @Router /itineraries/{itineraryId}/entries [post]
func (h *ItineraryHandler) CreateEntry(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.CreateEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	itineraryID := c.Param("itineraryId")

	// Debug: log raw request body
	bodyBytes, _ := c.GetRawData()
	logger.Info("Raw request body: " + string(bodyBytes))

	// Restore body for binding
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req schemas.CreateEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"itineraryID": itineraryID,
		"type":        req.Type,
		"title":       req.Title,
		"place":       req.Place,
		"placeID":     req.PlaceID,
	})

	// Set default description if not provided
	description := ""
	if req.Description != nil {
		description = *req.Description
	}

	entry, err := h.itineraryService.CreateEntry(
		ctx,
		itineraryID,
		models.EntryType(req.Type),
		req.Title,
		description,
		req.PlaceID,
		req.Place,
		req.StartTime,
		req.EndTime,
		req.Order,
		req.Todos,
	)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{"entryID": entry.ID.Hex()})
	c.JSON(http.StatusCreated, entry)
}

// UpdateEntry godoc
// @Summary Update an entry
// @Tags itinerary-entries
// @Param id path string true "Entry ID"
// @Param entry body schemas.UpdateEntryRequest true "Entry data"
// @Success 200 {object} models.ItineraryEntry
// @Router /entries/{id} [patch]
func (h *ItineraryHandler) UpdateEntry(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.UpdateEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")

	var req schemas.UpdateEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{"entryID": entryID})

	entry, err := h.itineraryService.UpdateEntry(
		ctx,
		entryID,
		req.Title,
		req.Description,
		req.StartTime,
		req.EndTime,
		req.Order,
		req.Todos,
	)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(entry)
	c.JSON(http.StatusOK, entry)
}

// DeleteEntry godoc
// @Summary Delete an entry
// @Tags itinerary-entries
// @Param id path string true "Entry ID"
// @Success 204
// @Router /entries/{id} [delete]
func (h *ItineraryHandler) DeleteEntry(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.DeleteEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")
	logger.Input(map[string]interface{}{"entryID": entryID})

	if err := h.itineraryService.DeleteEntry(ctx, entryID); err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output("Entry deleted successfully")
	c.Status(http.StatusNoContent)
}

// UpdateTodos godoc
// @Summary Update todos for an entry
// @Tags itinerary-entries
// @Param id path string true "Entry ID"
// @Param todos body schemas.UpdateTodosRequest true "Todos data"
// @Success 200 {object} gin.H
// @Router /entries/{id}/todos [patch]
func (h *ItineraryHandler) UpdateTodos(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.UpdateTodos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")

	var req schemas.UpdateTodosRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"entryID":    entryID,
		"todosCount": len(req.Todos),
	})

	if err := h.itineraryService.UpdateTodos(ctx, entryID, req.Todos); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output("Todos updated successfully")
	c.JSON(http.StatusOK, gin.H{"message": "todos updated"})
}

// CreateTodo godoc
// @Summary Create a new todo in an entry
// @Tags itinerary-entries
// @Param entryId path string true "Entry ID"
// @Param todo body schemas.CreateTodoRequest true "Todo data"
// @Success 201 {object} models.Todo
// @Router /entries/{entryId}/todos [post]
func (h *ItineraryHandler) CreateTodo(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.CreateTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")

	var req schemas.CreateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"title":   req.Title,
		"order":   *req.Order,
	})

	todo, err := h.itineraryService.CreateTodo(ctx, entryID, req.Title, *req.Order)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"todoID": todo.ID,
	})
	c.JSON(http.StatusCreated, todo)
}

// UpdateTodo godoc
// @Summary Update a todo's title
// @Tags itinerary-entries
// @Param entryId path string true "Entry ID"
// @Param todoId path string true "Todo ID"
// @Param todo body schemas.UpdateTodoRequest true "Todo data"
// @Success 200 {object} gin.H
// @Router /entries/{entryId}/todos/{todoId} [patch]
func (h *ItineraryHandler) UpdateTodo(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.UpdateTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")
	todoID := c.Param("todoId")

	var req schemas.UpdateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title == nil {
		logger.Warn("No fields to update")
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"todoID":  todoID,
		"title":   *req.Title,
	})

	if err := h.itineraryService.UpdateTodo(ctx, entryID, todoID, *req.Title); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output("Todo updated successfully")
	c.JSON(http.StatusOK, gin.H{"message": "todo updated"})
}

// DeleteTodo godoc
// @Summary Delete a todo by ID
// @Tags itinerary-entries
// @Param entryId path string true "Entry ID"
// @Param todoId path string true "Todo ID"
// @Success 204
// @Router /entries/{entryId}/todos/{todoId} [delete]
func (h *ItineraryHandler) DeleteTodo(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.DeleteTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")
	todoID := c.Param("todoId")

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"todoID":  todoID,
	})

	if err := h.itineraryService.DeleteTodo(ctx, entryID, todoID); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output("Todo deleted successfully")
	c.Status(http.StatusNoContent)
}

// ReorderTodos godoc
// @Summary Reorder todos in an entry
// @Tags itinerary-entries
// @Param entryId path string true "Entry ID"
// @Param todoIds body schemas.ReorderTodosRequest true "Todo IDs in new order"
// @Success 200 {object} gin.H
// @Router /entries/{entryId}/todos/reorder [patch]
func (h *ItineraryHandler) ReorderTodos(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.ReorderTodos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")

	var req schemas.ReorderTodosRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"entryID":     entryID,
		"todoIDCount": len(req.TodoIDs),
	})

	entry, err := h.itineraryService.ReorderTodos(ctx, entryID, req.TodoIDs)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert model to response schema
	entryResponse := schemas.ToItineraryEntryResponse(entry)

	logger.Output("Todos reordered successfully")
	c.JSON(http.StatusOK, gin.H{
		"message": "todos reordered",
		"entry":   entryResponse,
	})
}

// ToggleTodo godoc
// @Summary Toggle a todo's completed status
// @Tags itinerary-entries
// @Param id path string true "Entry ID"
// @Param todoId path string true "Todo ID"
// @Success 200 {object} gin.H
// @Router /entries/{id}/todos/{todoId}/toggle [post]
func (h *ItineraryHandler) ToggleTodo(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.ToggleTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	entryID := c.Param("entryId")
	todoID := c.Param("todoId")

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"todoID":  todoID,
	})

	if err := h.itineraryService.ToggleTodo(ctx, entryID, todoID); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output("Todo toggled successfully")
	c.JSON(http.StatusOK, gin.H{"message": "todo toggled"})
}

// ReorderEntries godoc
// @Summary Reorder entries in an itinerary
// @Tags itinerary-entries
// @Param itineraryId path string true "Itinerary ID"
// @Param entryIds body schemas.ReorderEntriesRequest true "Entry IDs in new order"
// @Success 200 {object} gin.H
// @Router /itineraries/{itineraryId}/entries/reorder [patch]
func (h *ItineraryHandler) ReorderEntries(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.ReorderEntries")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	itineraryID := c.Param("itineraryId")

	var req schemas.ReorderEntriesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"itineraryID":   itineraryID,
		"entryIDCount": len(req.EntryIDs),
	})

	entries, err := h.itineraryService.ReorderEntries(ctx, itineraryID, req.EntryIDs)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output("Entries reordered successfully")
	c.JSON(http.StatusOK, gin.H{
		"message": "entries reordered",
		"entries": entries,
	})
}

// InsertItineraryAfter godoc
// @Summary Insert a new itinerary (day) after the specified itinerary
// @Description Creates a new day after the specified itinerary, shifts all subsequent days' dayNumber and date by 1, and extends the trip's endDate by 1 day
// @Tags itineraries
// @Param id path string true "Trip ID"
// @Param itineraryId path string true "Itinerary ID to insert after"
// @Success 201 {object} models.Itinerary
// @Router /trips/{id}/itineraries/{itineraryId}/insert-after [post]
func (h *ItineraryHandler) InsertItineraryAfter(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ItineraryHandler.InsertItineraryAfter")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	itineraryID := c.Param("itineraryId")

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":       tripID,
		"itineraryID":  itineraryID,
		"userID":       userID,
	})

	newItinerary, err := h.itineraryService.InsertItineraryAfter(ctx, tripID, itineraryID, userID)
	if err != nil {
		logger.Error(err)
		if err.Error() == "trip not found" || err.Error() == "itinerary not found" {
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

	logger.Output(map[string]interface{}{
		"newItineraryID": newItinerary.ID.Hex(),
		"dayNumber":      newItinerary.DayNumber,
	})
	Success(c, http.StatusCreated, newItinerary)
}
