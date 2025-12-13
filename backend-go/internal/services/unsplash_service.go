package services

import (
	"context"

	"backend-go/internal/config"
	"backend-go/pkg/unsplash"
	"backend-go/pkg/utils"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type UnsplashService struct {
	client *unsplash.Client
	tracer trace.Tracer
}

func NewUnsplashService(cfg *config.UnsplashConfig) (*UnsplashService, error) {
	client, err := unsplash.NewClient(cfg.AccessKey, cfg.SecretKey)
	if err != nil {
		return nil, err
	}

	return &UnsplashService{
		client: client,
		tracer: otel.Tracer("unsplash-service"),
	}, nil
}

// SearchPhotos searches for photos on Unsplash
func (s *UnsplashService) SearchPhotos(ctx context.Context, query string, page, perPage int) (*unsplash.SearchPhotosResponse, error) {
	ctx, span := s.tracer.Start(ctx, "UnsplashService.SearchPhotos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"query":   query,
		"page":    page,
		"perPage": perPage,
	})

	result, err := s.client.SearchPhotos(ctx, query, page, perPage)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"total":   result.Total,
		"results": len(result.Results),
	})
	return result, nil
}

// GetRandomPhotos gets random photos from Unsplash
func (s *UnsplashService) GetRandomPhotos(ctx context.Context, query string, count int) ([]unsplash.Photo, error) {
	ctx, span := s.tracer.Start(ctx, "UnsplashService.GetRandomPhotos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"query": query,
		"count": count,
	})

	photos, err := s.client.GetRandomPhoto(ctx, query, count)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(photos),
	})
	return photos, nil
}

// GetPhoto gets a specific photo by ID
func (s *UnsplashService) GetPhoto(ctx context.Context, photoID string) (*unsplash.Photo, error) {
	ctx, span := s.tracer.Start(ctx, "UnsplashService.GetPhoto")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"photoID": photoID,
	})

	photo, err := s.client.GetPhoto(ctx, photoID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"id": photo.ID,
	})
	return photo, nil
}

// TriggerDownload triggers a download event (required by Unsplash API guidelines)
func (s *UnsplashService) TriggerDownload(ctx context.Context, downloadLocation string) error {
	ctx, span := s.tracer.Start(ctx, "UnsplashService.TriggerDownload")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"downloadLocation": downloadLocation,
	})

	err := s.client.TriggerDownload(ctx, downloadLocation)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Download event triggered successfully")
	return nil
}
