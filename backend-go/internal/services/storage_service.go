package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"backend-go/internal/config"
	"backend-go/pkg/utils"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type StorageService struct {
	client       *s3.Client
	bucketName   string
	devSubdomain string
	tracer       trace.Tracer
}

func NewStorageService(cfg *config.R2Config) (*StorageService, error) {
	// Create R2 endpoint URL
	r2Endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
	if cfg.Endpoint != "" {
		r2Endpoint = cfg.Endpoint
	}

	// Configure AWS SDK for R2
	r2Config, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		)),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load R2 config: %w", err)
	}

	// Create S3 client for R2
	client := s3.NewFromConfig(r2Config, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(r2Endpoint)
	})

	return &StorageService{
		client:       client,
		bucketName:   cfg.BucketName,
		devSubdomain: cfg.DevSubdomain,
		tracer:       otel.Tracer("storage-service"),
	}, nil
}

// UploadFile uploads a file to R2 and returns the public URL
func (s *StorageService) UploadFile(ctx context.Context, fileData []byte, filename string, contentType string) (string, error) {
	ctx, span := s.tracer.Start(ctx, "StorageService.UploadFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"filename":    filename,
		"contentType": contentType,
		"size":        len(fileData),
	})

	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueFilename := fmt.Sprintf("%s-%s%s", time.Now().Format("20060102"), uuid.New().String(), ext)

	// Upload to R2
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(uniqueFilename),
		Body:        bytes.NewReader(fileData),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		logger.Error(fmt.Errorf("failed to upload file to R2: %w", err))
		return "", fmt.Errorf("failed to upload file to R2: %w", err)
	}

	// Generate public URL using dev subdomain
	publicURL := fmt.Sprintf("https://%s/%s", s.devSubdomain, uniqueFilename)

	logger.Output(map[string]interface{}{
		"url":            publicURL,
		"uniqueFilename": uniqueFilename,
	})
	return publicURL, nil
}

// DeleteFile deletes a file from R2
func (s *StorageService) DeleteFile(ctx context.Context, fileURL string) error {
	ctx, span := s.tracer.Start(ctx, "StorageService.DeleteFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Extract key from URL
	key := filepath.Base(fileURL)

	logger.Input(map[string]interface{}{
		"fileURL": fileURL,
		"key":     key,
	})

	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		logger.Error(fmt.Errorf("failed to delete file from R2: %w", err))
		return fmt.Errorf("failed to delete file from R2: %w", err)
	}

	logger.Info("File deleted successfully")
	return nil
}

// GetFile retrieves a file from R2
func (s *StorageService) GetFile(ctx context.Context, fileURL string) ([]byte, error) {
	ctx, span := s.tracer.Start(ctx, "StorageService.GetFile")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	key := filepath.Base(fileURL)

	logger.Input(map[string]interface{}{
		"fileURL": fileURL,
		"key":     key,
	})

	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		logger.Error(fmt.Errorf("failed to get file from R2: %w", err))
		return nil, fmt.Errorf("failed to get file from R2: %w", err)
	}
	defer result.Body.Close()

	data, err := io.ReadAll(result.Body)
	if err != nil {
		logger.Error(fmt.Errorf("failed to read file data: %w", err))
		return nil, fmt.Errorf("failed to read file data: %w", err)
	}

	logger.Output(map[string]interface{}{
		"size": len(data),
	})
	return data, nil
}
