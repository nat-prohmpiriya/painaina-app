package repository

import (
	"context"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"backend-go/internal/models"
	"backend-go/pkg/utils"
)

type FileRepository struct{
	tracer trace.Tracer
}

func NewFileRepository() *FileRepository {
	return &FileRepository{
		tracer: otel.Tracer("file-repository"),
	}
}

// Create creates a new file
func (r *FileRepository) Create(ctx context.Context, file *models.File) error {
	ctx, span := r.tracer.Start(ctx, "FileRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"ownerID": file.OwnerID.Hex(),
		"type":    file.Type,
		"url":     file.URL,
	})

	// Set timestamps manually
	now := time.Now()
	file.CreatedAt = now
	file.UpdatedAt = now

	err := mgm.Coll(file).CreateWithCtx(ctx, file)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"fileID": file.ID.Hex(),
	})
	return nil
}

// FindByID finds a file by ID
func (r *FileRepository) FindByID(ctx context.Context, id string) (*models.File, error) {
	ctx, span := r.tracer.Start(ctx, "FileRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"fileID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	file := &models.File{}
	err = mgm.Coll(file).FindByIDWithCtx(ctx, objectID, file)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"url":  file.URL,
		"type": file.Type,
	})
	return file, nil
}

// FindByOwnerID finds all files by owner ID
func (r *FileRepository) FindByOwnerID(ctx context.Context, ownerID string, skip, limit int64) ([]*models.File, error) {
	ctx, span := r.tracer.Start(ctx, "FileRepository.FindByOwnerID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"ownerID": ownerID,
		"skip":    skip,
		"limit":   limit,
	})

	objectID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	files := []*models.File{}
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := mgm.Coll(&models.File{}).Find(ctx, bson.M{"owner_id": objectID}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &files)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(files),
	})
	return files, nil
}

// FindByType finds files by type
func (r *FileRepository) FindByType(ctx context.Context, fileType string, skip, limit int64) ([]*models.File, error) {
	ctx, span := r.tracer.Start(ctx, "FileRepository.FindByType")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"type":  fileType,
		"skip":  skip,
		"limit": limit,
	})

	files := []*models.File{}
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := mgm.Coll(&models.File{}).Find(ctx, bson.M{"type": fileType}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &files)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(files),
	})
	return files, nil
}

// Update updates a file
func (r *FileRepository) Update(ctx context.Context, file *models.File) error {
	ctx, span := r.tracer.Start(ctx, "FileRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"fileID": file.ID.Hex(),
	})

	err := mgm.Coll(file).UpdateWithCtx(ctx, file)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("File updated successfully")
	return nil
}

// Delete deletes a file
func (r *FileRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "FileRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"fileID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.File{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("File deleted successfully")
	return nil
}

// List lists all files with pagination
func (r *FileRepository) List(ctx context.Context, skip, limit int64) ([]*models.File, error) {
	ctx, span := r.tracer.Start(ctx, "FileRepository.List")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"skip":  skip,
		"limit": limit,
	})

	files := []*models.File{}
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := mgm.Coll(&models.File{}).Find(ctx, bson.M{}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &files)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(files),
	})
	return files, nil
}

// Count counts total files
func (r *FileRepository) Count(ctx context.Context) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "FileRepository.Count")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	count, err := mgm.Coll(&models.File{}).CountDocuments(ctx, bson.M{})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}
