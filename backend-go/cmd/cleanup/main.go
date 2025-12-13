package main

import (
	"context"
	"log"

	"backend-go/internal/config"
	"backend-go/internal/services"
	"backend-go/pkg/mongodb"
)

// Cleanup job to delete places older than 30 days (Google TOS compliance)
func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize MGM (Mongo Go Models)
	err = mongodb.InitMGM(
		cfg.MongoDB.URI,
		cfg.MongoDB.Database,
	)
	if err != nil {
		log.Fatalf("Failed to initialize MGM: %v", err)
	}
	log.Println("✓ Connected to MongoDB")

	// Create city service
	cityService, err := services.NewInMemoryCityService()
	if err != nil {
		log.Fatalf("Failed to initialize city service: %v", err)
	}
	log.Println("✓ Loaded city service")

	// Create place service
	placeService := services.NewPlaceService(&cfg.Google, cityService)

	// Run cleanup
	ctx := context.Background()
	deletedCount, err := placeService.CleanupExpiredCache(ctx)
	if err != nil {
		log.Fatalf("Failed to cleanup cache: %v", err)
	}

	log.Printf("✓ Cleanup completed: %d places deleted", deletedCount)
}
