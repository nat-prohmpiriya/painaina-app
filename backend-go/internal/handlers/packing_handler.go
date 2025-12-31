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

type PackingHandler struct {
	packingService *services.PackingService
	tracer         trace.Tracer
}

func NewPackingHandler() *PackingHandler {
	return &PackingHandler{
		packingService: services.NewPackingService(),
		tracer:         otel.Tracer("packing-handler"),
	}
}

// RegisterRoutes registers packing routes under /trips/:id
func (h *PackingHandler) RegisterRoutes(trips *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	// Public routes
	trips.GET("/packing", h.GetPackingList)
	trips.GET("/packing/stats", h.GetPackingStats)

	// Authenticated routes
	authenticated := trips.Group("")
	authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		authenticated.POST("/packing/items", h.AddItem)
		authenticated.PATCH("/packing/items/:itemId", h.UpdateItem)
		authenticated.DELETE("/packing/items/:itemId", h.DeleteItem)
		authenticated.POST("/packing/items/:itemId/toggle", h.ToggleItemPacked)
		authenticated.POST("/packing/reorder", h.ReorderItems)
		authenticated.POST("/packing/template", h.ApplyTemplate)
	}
}

// RegisterTemplateRoutes registers template routes (no trip ID required)
func (h *PackingHandler) RegisterTemplateRoutes(v1 *gin.RouterGroup) {
	v1.GET("/packing/templates", h.GetTemplates)
}

// GetPackingList godoc
// @Summary Get packing list for a trip
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Success 200 {object} models.PackingList
// @Router /trips/{tripId}/packing [get]
func (h *PackingHandler) GetPackingList(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.GetPackingList")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	packingList, err := h.packingService.GetPackingList(ctx, tripID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"itemCount": len(packingList.Items),
	})
	c.JSON(http.StatusOK, packingList)
}

// GetPackingStats godoc
// @Summary Get packing statistics for a trip
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Success 200 {object} gin.H
// @Router /trips/{tripId}/packing/stats [get]
func (h *PackingHandler) GetPackingStats(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.GetPackingStats")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	stats, err := h.packingService.GetPackingStats(ctx, tripID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output(stats)
	c.JSON(http.StatusOK, stats)
}

// AddItem godoc
// @Summary Add an item to the packing list
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Param item body schemas.CreatePackingItemRequest true "Item data"
// @Success 201 {object} models.PackingList
// @Router /trips/{tripId}/packing/items [post]
func (h *PackingHandler) AddItem(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.AddItem")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	var req schemas.CreatePackingItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":   tripID,
		"name":     req.Name,
		"category": req.Category,
		"quantity": req.Quantity,
	})

	packingList, err := h.packingService.AddItem(ctx, tripID, req)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"itemCount": len(packingList.Items),
	})
	c.JSON(http.StatusCreated, packingList)
}

// UpdateItem godoc
// @Summary Update an item in the packing list
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Param itemId path string true "Item ID"
// @Param item body schemas.UpdatePackingItemRequest true "Item data"
// @Success 200 {object} models.PackingList
// @Router /trips/{tripId}/packing/items/{itemId} [patch]
func (h *PackingHandler) UpdateItem(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.UpdateItem")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	itemID := c.Param("itemId")

	var req schemas.UpdatePackingItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"itemID": itemID,
	})

	packingList, err := h.packingService.UpdateItem(ctx, tripID, itemID, req)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"itemCount": len(packingList.Items),
	})
	c.JSON(http.StatusOK, packingList)
}

// DeleteItem godoc
// @Summary Delete an item from the packing list
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Param itemId path string true "Item ID"
// @Success 200 {object} models.PackingList
// @Router /trips/{tripId}/packing/items/{itemId} [delete]
func (h *PackingHandler) DeleteItem(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.DeleteItem")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	itemID := c.Param("itemId")

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"itemID": itemID,
	})

	packingList, err := h.packingService.DeleteItem(ctx, tripID, itemID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"itemCount": len(packingList.Items),
	})
	c.JSON(http.StatusOK, packingList)
}

// ToggleItemPacked godoc
// @Summary Toggle packed status of an item
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Param itemId path string true "Item ID"
// @Success 200 {object} models.PackingList
// @Router /trips/{tripId}/packing/items/{itemId}/toggle [post]
func (h *PackingHandler) ToggleItemPacked(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.ToggleItemPacked")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	itemID := c.Param("itemId")

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"itemID": itemID,
	})

	packingList, err := h.packingService.ToggleItemPacked(ctx, tripID, itemID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Item packed status toggled")
	c.JSON(http.StatusOK, packingList)
}

// ReorderItems godoc
// @Summary Reorder items in the packing list
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Param reorder body schemas.ReorderPackingItemsRequest true "Reorder data"
// @Success 200 {object} models.PackingList
// @Router /trips/{tripId}/packing/reorder [post]
func (h *PackingHandler) ReorderItems(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.ReorderItems")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	var req schemas.ReorderPackingItemsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":    tripID,
		"itemCount": len(req.ItemIDs),
	})

	packingList, err := h.packingService.ReorderItems(ctx, tripID, req.ItemIDs)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Items reordered successfully")
	c.JSON(http.StatusOK, packingList)
}

// ApplyTemplate godoc
// @Summary Apply a packing template
// @Tags packing
// @Param tripId path string true "Trip ID"
// @Param template body schemas.ApplyPackingTemplateRequest true "Template data"
// @Success 200 {object} models.PackingList
// @Router /trips/{tripId}/packing/template [post]
func (h *PackingHandler) ApplyTemplate(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "PackingHandler.ApplyTemplate")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	var req schemas.ApplyPackingTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":     tripID,
		"templateID": req.TemplateID,
	})

	packingList, err := h.packingService.ApplyTemplate(ctx, tripID, req.TemplateID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"itemCount": len(packingList.Items),
	})
	c.JSON(http.StatusOK, packingList)
}

// GetTemplates godoc
// @Summary Get all packing templates
// @Tags packing
// @Success 200 {array} schemas.PackingTemplate
// @Router /packing/templates [get]
func (h *PackingHandler) GetTemplates(c *gin.Context) {
	ctx := c.Request.Context()
	_, span := h.tracer.Start(ctx, "PackingHandler.GetTemplates")
	defer span.End()

	templates := h.packingService.GetTemplates()
	c.JSON(http.StatusOK, templates)
}
