package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"

	"backend-go/internal/config"
	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/pkg/utils"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type FileService struct {
	fileRepo       *repository.FileRepository
	storageService *StorageService
	tracer         trace.Tracer
}

func NewFileService(cfg *config.R2Config) (*FileService, error) {
	storage, err := NewStorageService(cfg)
	if err != nil {
		return nil, err
	}

	return &FileService{
		fileRepo:       repository.NewFileRepository(),
		storageService: storage,
		tracer:         otel.Tracer("file-service"),
	}, nil
}

// UploadFile handles file upload to R2 and saves metadata to DB
func (s *FileService) UploadFile(ctx context.Context, userID string, fileHeader *multipart.FileHeader) (*models.File, error) {
	ctx, span := s.tracer.Start(ctx, "FileService.UploadFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":   userID,
		"filename": fileHeader.Filename,
		"size":     fileHeader.Size,
	})

	// Validate file size (max 50MB)
	maxSize := int64(50 * 1024 * 1024)
	if fileHeader.Size > maxSize {
		err := errors.New("file size exceeds 50MB limit")
		logger.Error(err)
		return nil, err
	}

	// Open uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		err := fmt.Errorf("failed to open file: %w", err)
		logger.Error(err)
		return nil, err
	}
	defer file.Close()

	// Read file data
	fileData := make([]byte, fileHeader.Size)
	_, err = file.Read(fileData)
	if err != nil {
		err := fmt.Errorf("failed to read file: %w", err)
		logger.Error(err)
		return nil, err
	}

	// Detect content type
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Upload to R2
	url, err := s.storageService.UploadFile(ctx, fileData, fileHeader.Filename, contentType)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Determine file type
	fileType := s.getFileType(contentType)

	// Convert userID to ObjectID
	ownerID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		err := errors.New("invalid user ID")
		logger.Error(err)
		return nil, err
	}

	// Create file record
	fileRecord := &models.File{
		OwnerID: ownerID,
		URL:     url,
		Type:    fileType,
		Size:    fileHeader.Size,
		Metadata: map[string]string{
			"original_filename": fileHeader.Filename,
			"content_type":      contentType,
		},
	}

	if err := s.fileRepo.Create(ctx, fileRecord); err != nil {
		// Cleanup uploaded file if DB insert fails
		_ = s.storageService.DeleteFile(ctx, url)
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"fileID": fileRecord.ID.Hex()})
	return fileRecord, nil
}

// GetFile retrieves file metadata
func (s *FileService) GetFile(ctx context.Context, fileID string) (*models.File, error) {
	ctx, span := s.tracer.Start(ctx, "FileService.GetFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"fileID": fileID})

	file, err := s.fileRepo.FindByID(ctx, fileID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(file)
	return file, nil
}

// ListFiles returns a list of files with filters
func (s *FileService) ListFiles(ctx context.Context, ownerID string, fileType string, limit, offset int) ([]*models.File, error) {
	ctx, span := s.tracer.Start(ctx, "FileService.ListFiles")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"ownerID":  ownerID,
		"fileType": fileType,
		"limit":    limit,
		"offset":   offset,
	})

	var files []*models.File
	var err error

	// If ownerID is provided, use FindByOwnerID
	if ownerID != "" {
		files, err = s.fileRepo.FindByOwnerID(ctx, ownerID, int64(offset), int64(limit))
	} else if fileType != "" {
		// If fileType is provided, use FindByType
		files, err = s.fileRepo.FindByType(ctx, fileType, int64(offset), int64(limit))
	} else {
		// Otherwise, list all files
		files, err = s.fileRepo.List(ctx, int64(offset), int64(limit))
	}

	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(files)})
	return files, nil
}

// DeleteFile deletes file from R2 and DB
func (s *FileService) DeleteFile(ctx context.Context, fileID, userID string) error {
	ctx, span := s.tracer.Start(ctx, "FileService.DeleteFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"fileID": fileID,
		"userID": userID,
	})

	// Get file record
	file, err := s.fileRepo.FindByID(ctx, fileID)
	if err != nil {
		err := errors.New("file not found")
		logger.Error(err)
		return err
	}

	// Check ownership
	if file.OwnerID.Hex() != userID {
		err := errors.New("unauthorized: you don't own this file")
		logger.Error(err)
		return err
	}

	// Delete from R2
	if err := s.storageService.DeleteFile(ctx, file.URL); err != nil {
		err := fmt.Errorf("failed to delete file from storage: %w", err)
		logger.Error(err)
		return err
	}

	// Delete from DB
	if err := s.fileRepo.Delete(ctx, fileID); err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("File deleted successfully")
	return nil
}

// getFileType determines file type from content type
func (s *FileService) getFileType(contentType string) string {
	switch {
	case contains(contentType, "image"):
		return models.FileTypePhoto
	case contains(contentType, "video"):
		return models.FileTypeVideo
	default:
		return models.FileTypeDocument
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[:len(substr)] == substr ||
		   len(s) > len(substr) && contains(s[1:], substr)
}
