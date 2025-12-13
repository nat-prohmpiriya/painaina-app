package handlers

import (
	"net/http"

	"backend-go/internal/config"
	"backend-go/internal/schemas"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type UnsplashHandler struct {
	unsplashService *services.UnsplashService
	tracer          trace.Tracer
}

func NewUnsplashHandler(cfg *config.UnsplashConfig) (*UnsplashHandler, error) {
	service, err := services.NewUnsplashService(cfg)
	if err != nil {
		return nil, err
	}

	return &UnsplashHandler{
		unsplashService: service,
		tracer:          otel.Tracer("unsplash-handler"),
	}, nil
}

// SearchPhotos handles searching photos on Unsplash
// GET /api/v1/unsplash/search?query=nature&page=1&perPage=10
func (h *UnsplashHandler) SearchPhotos(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UnsplashHandler.SearchPhotos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.SearchPhotosRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	// Set defaults
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PerPage == 0 {
		req.PerPage = 10
	}

	logger.Input(map[string]interface{}{
		"query":   req.Query,
		"page":    req.Page,
		"perPage": req.PerPage,
	})

	result, err := h.unsplashService.SearchPhotos(ctx, req.Query, req.Page, req.PerPage)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"total":   result.Total,
		"results": len(result.Results),
	})
	Success(c, http.StatusOK, result)
}

// GetRandomPhotos handles getting random photos from Unsplash
// GET /api/v1/unsplash/random?query=nature&count=5
func (h *UnsplashHandler) GetRandomPhotos(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UnsplashHandler.GetRandomPhotos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.GetRandomPhotosRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	// Set default count
	if req.Count == 0 {
		req.Count = 1
	}

	logger.Input(map[string]interface{}{
		"query": req.Query,
		"count": req.Count,
	})

	photos, err := h.unsplashService.GetRandomPhotos(ctx, req.Query, req.Count)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(photos),
	})
	Success(c, http.StatusOK, gin.H{
		"photos": photos,
	})
}

// GetPhoto handles getting a specific photo by ID
// GET /api/v1/unsplash/photos/:photoId
func (h *UnsplashHandler) GetPhoto(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UnsplashHandler.GetPhoto")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.GetPhotoRequest
	if err := c.ShouldBindUri(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"photoId": req.PhotoID,
	})

	photo, err := h.unsplashService.GetPhoto(ctx, req.PhotoID)
	if err != nil {
		logger.Error(err)
		NotFound(c, "Photo not found")
		return
	}

	logger.Output(map[string]interface{}{
		"id": photo.ID,
	})
	Success(c, http.StatusOK, photo)
}

// TriggerDownload handles triggering a download event
// POST /api/v1/unsplash/download
func (h *UnsplashHandler) TriggerDownload(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "UnsplashHandler.TriggerDownload")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.TriggerDownloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	logger.Input(map[string]interface{}{
		"downloadLocation": req.DownloadLocation,
	})

	if err := h.unsplashService.TriggerDownload(ctx, req.DownloadLocation); err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Info("Download event triggered successfully")
	Success(c, http.StatusOK, gin.H{
		"message": "Download event triggered successfully",
	})
}

// RegisterRoutes registers unsplash routes
func (h *UnsplashHandler) RegisterRoutes(v1 *gin.RouterGroup) {
	unsplash := v1.Group("/unsplash")
	{
		// Public routes
		unsplash.GET("/search", h.SearchPhotos)
		unsplash.GET("/random", h.GetRandomPhotos)
		unsplash.GET("/photos/:photoId", h.GetPhoto)
		unsplash.POST("/download", h.TriggerDownload)
	}
}
