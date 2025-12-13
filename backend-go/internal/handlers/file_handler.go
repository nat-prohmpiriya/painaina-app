package handlers

import (
	"net/http"

	"backend-go/internal/config"
	"backend-go/internal/middleware"
	"backend-go/internal/schemas"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type FileHandler struct {
	fileService *services.FileService
	tracer      trace.Tracer
}

func NewFileHandler(cfg *config.R2Config) (*FileHandler, error) {
	fileService, err := services.NewFileService(cfg)
	if err != nil {
		return nil, err
	}

	return &FileHandler{
		fileService: fileService,
		tracer:      otel.Tracer("file-handler"),
	}, nil
}

// UploadFile handles file upload
// POST /api/v1/files/upload
func (h *FileHandler) UploadFile(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "FileHandler.UploadFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	// Get file from form
	fileHeader, err := c.FormFile("file")
	if err != nil {
		logger.Error(err)
		BadRequest(c, "No file provided")
		return
	}

	logger.Input(map[string]interface{}{
		"userID":   userID,
		"filename": fileHeader.Filename,
		"size":     fileHeader.Size,
	})

	// Upload file
	file, err := h.fileService.UploadFile(ctx, userID, fileHeader)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	// Map to response
	response := &schemas.UploadFileResponse{
		ID:       file.ID.Hex(),
		URL:      file.URL,
		Type:     file.Type,
		Size:     file.Size,
		Metadata: file.Metadata,
	}

	logger.Output(map[string]interface{}{
		"fileId": file.ID.Hex(),
		"url":    file.URL,
	})
	Success(c, http.StatusCreated, response)
}

// ListFiles returns a list of files with filters
// GET /api/v1/files?ownerId=&type=&limit=&offset=
func (h *FileHandler) ListFiles(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "FileHandler.ListFiles")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	var req schemas.ListFilesRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Error(err)
		BadRequest(c, err.Error())
		return
	}

	// Set default limit
	if req.Limit == 0 {
		req.Limit = 20
	}

	logger.Input(map[string]interface{}{
		"ownerId": req.OwnerID,
		"type":    req.Type,
		"limit":   req.Limit,
		"offset":  req.Offset,
	})

	files, err := h.fileService.ListFiles(
		ctx,
		req.OwnerID,
		req.Type,
		req.Limit,
		req.Offset,
	)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, err.Error())
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(files),
	})
	Success(c, http.StatusOK, files)
}

// GetFile returns file metadata
// GET /api/v1/files/:id
func (h *FileHandler) GetFile(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "FileHandler.GetFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	fileID := c.Param("id")
	if fileID == "" {
		logger.Warn("File ID is required")
		BadRequest(c, "File ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"fileId": fileID,
	})

	file, err := h.fileService.GetFile(ctx, fileID)
	if err != nil {
		logger.Error(err)
		NotFound(c, "File not found")
		return
	}

	logger.Output(file)
	Success(c, http.StatusOK, file)
}

// DeleteFile deletes a file
// DELETE /api/v1/files/:id
func (h *FileHandler) DeleteFile(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "FileHandler.DeleteFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		logger.Warn("User not authenticated")
		Unauthorized(c, "User not authenticated")
		return
	}

	fileID := c.Param("id")
	if fileID == "" {
		logger.Warn("File ID is required")
		BadRequest(c, "File ID is required")
		return
	}

	logger.Input(map[string]interface{}{
		"fileId": fileID,
		"userID": userID,
	})

	err := h.fileService.DeleteFile(ctx, fileID, userID)
	if err != nil {
		logger.Error(err)
		if err.Error() == "file not found" {
			NotFound(c, "File not found")
			return
		}
		if err.Error() == "unauthorized: you don't own this file" {
			Forbidden(c, "You don't have permission to delete this file")
			return
		}
		InternalServerError(c, err.Error())
		return
	}

	logger.Info("File deleted successfully")
	Success(c, http.StatusOK, gin.H{"message": "File deleted successfully"})
}

// RegisterRoutes registers file routes
func (h *FileHandler) RegisterRoutes(v1 *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	files := v1.Group("/files")
	files.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		files.POST("/upload", h.UploadFile)
		files.GET("", h.ListFiles)
		files.GET("/:id", h.GetFile)
		files.DELETE("/:id", h.DeleteFile)
	}
}
