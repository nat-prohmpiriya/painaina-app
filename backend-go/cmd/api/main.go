package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"backend-go/internal/config"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/repository"
	"backend-go/internal/services"
	"backend-go/pkg/mongodb"
	"backend-go/pkg/otel"
	"backend-go/pkg/redis"
	"backend-go/pkg/sse"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set Gin mode
	gin.SetMode(cfg.Server.GinMode)

	// Initialize OpenTelemetry (traces, metrics, logs)
	log.Println("Initializing OpenTelemetry...")
	otelManager, err := otel.NewOtelManager(cfg)
	if err != nil {
		log.Printf("⚠️  Failed to initialize OTEL: %v", err)
	} else {
		if err := otelManager.Initialize(); err != nil {
			log.Printf("⚠️  Failed to initialize OTEL providers: %v", err)
		}
	}
	defer func() {
		if otelManager != nil {
			if err := otelManager.Shutdown(context.Background()); err != nil {
				log.Printf("Failed to shutdown OTEL: %v", err)
			}
		}
	}()

	// Initialize MGM (Mongo Go Models)
	err = mongodb.InitMGM(
		cfg.MongoDB.URI,
		cfg.MongoDB.Database,
	)
	if err != nil {
		log.Fatalf("Failed to initialize MGM: %v", err)
	}
	log.Println("✓ Connected to MongoDB with MGM")

	// Connect to Redis
	var redisClient *redis.Client
	if cfg.Redis.URL != "" {
		// Use URL-based connection for Upstash Redis
		redisClient, err = redis.ConnectWithURL(cfg.Redis.URL)
		if err != nil {
			log.Fatalf("Failed to connect to Redis: %v", err)
		}
	} else {
		// Fallback to Addr-based connection for local Redis
		redisClient, err = redis.Connect(
			cfg.Redis.Addr,
			cfg.Redis.Password,
			cfg.Redis.DB,
		)
		if err != nil {
			log.Fatalf("Failed to connect to Redis: %v", err)
		}
	}
	defer redisClient.Close()
	log.Println("✓ Connected to Redis")

	// Initialize SSE Hub for real-time notifications
	sseHub := sse.NewHub()
	log.Println("✓ Initialized SSE Hub for real-time notifications")

	// Create Gin router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORS(&cfg.CORS))
	router.Use(middleware.OTelMiddleware(cfg.Server.ServiceName))

	// Add metrics middleware if enabled
	if otelManager != nil && otelManager.IsMetricsEnabled() {
		router.Use(middleware.MetricsMiddleware(otelManager.GetMetricsManager()))
	}

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler()
	userHandler := handlers.NewUserHandler()
	expenseHandler := handlers.NewExpenseHandler()
	itineraryHandler := handlers.NewItineraryHandler()
	fileHandler, err := handlers.NewFileHandler(&cfg.R2)
	if err != nil {
		log.Fatalf("Failed to create file handler: %v", err)
	}

	// Initialize city autocomplete service
	cityService, err := services.NewInMemoryCityService()
	if err != nil {
		log.Fatalf("Failed to load city service: %v", err)
	}
	log.Printf("✓ Loaded %d cities for autocomplete", cityService.Count())

	// Initialize Redis service for photo caching
	redisService := services.NewRedisService(cfg)
	if redisService == nil {
		log.Println("⚠ Redis service not available - photo caching disabled")
	} else {
		log.Println("✓ Redis connected for photo caching")
	}

	// Initialize notification system
	db := mongodb.GetDB()
	notificationRepo := repository.NewNotificationRepository(db)
	userRepo := repository.NewUserRepository()
	notificationService := services.NewNotificationService(notificationRepo, userRepo, sseHub)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	sseHandler := handlers.NewSSEHandler(sseHub)

	placeHandler := handlers.NewPlaceHandler(&cfg.Google, cityService, redisService)
	commentHandler := handlers.NewCommentHandler(notificationService)
	tripHandler := handlers.NewTripHandler(notificationService)

	// Initialize check-in service and handler
	checkInRepo := repository.NewCheckInRepository()
	checkInService := services.NewCheckInService(checkInRepo)
	checkInHandler := handlers.NewCheckInHandler(checkInService)
	unsplashHandler, err := handlers.NewUnsplashHandler(&cfg.Unsplash)
	if err != nil {
		log.Fatalf("Failed to create unsplash handler: %v", err)
	}

	// Initialize admin handlers
	adminStatsHandler := handlers.NewAdminStatsHandler(db)
	adminUserHandler := handlers.NewAdminUserHandler(db)
	adminTripHandler := handlers.NewAdminTripHandler(db)
	adminSystemHandler := handlers.NewAdminSystemHandler(db)

	// Health check endpoint
	router.GET("/", healthHandler.Check)

	// API v1 routes
	v1 := router.Group("/api/v1")

	// Register routes
	userHandler.RegisterRoutes(v1, cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain)
	fileHandler.RegisterRoutes(v1, cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain)
	placeHandler.RegisterRoutes(v1, cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain, commentHandler)
	commentHandler.RegisterCommentRoutes(v1, cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain)
	unsplashHandler.RegisterRoutes(v1)

	// Notification routes
	notifications := v1.Group("/notifications")
	notifications.Use(middleware.Auth(cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain))
	{
		notifications.GET("", notificationHandler.GetNotifications)
		notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
		notifications.PUT("/:id/read", notificationHandler.MarkAsRead)
		notifications.PUT("/read-all", notificationHandler.MarkAllAsRead)
	}

	// SSE routes for real-time notifications
	// Uses SSEAuth which accepts token from query parameter (EventSource doesn't support custom headers)
	sseRoutes := v1.Group("/sse")
	sseRoutes.Use(middleware.SSEAuth(cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain))
	{
		sseRoutes.GET("/notifications", sseHandler.StreamNotifications)
	}

	// Check-in routes
	checkins := v1.Group("/checkins")
	checkins.Use(middleware.Auth(cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain))
	{
		checkins.POST("", checkInHandler.CreateCheckIn)
		checkins.GET("/:id", checkInHandler.GetCheckIn)
		checkins.PUT("/:id", checkInHandler.UpdateCheckIn)
		checkins.DELETE("/:id", checkInHandler.DeleteCheckIn)
	}

	// User check-ins routes (public - can view other users' check-ins)
	v1.GET("/users/:userId/checkins", checkInHandler.GetUserCheckIns)
	v1.GET("/users/:userId/checkins/stats", checkInHandler.GetUserCheckInStats)

	// Trip routes - both /trips and /trips/:id
	trips := v1.Group("/trips")
	trips.GET("", tripHandler.ListTrips)

	authenticated := trips.Group("")
	authenticated.Use(middleware.Auth(cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain))
	{
		authenticated.POST("", tripHandler.CreateTrip)
	}

	// Trip detail routes with :id parameter
	tripDetail := trips.Group("/:id")
	tripHandler.RegisterRoutes(tripDetail, cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain, commentHandler, expenseHandler, itineraryHandler)
	expenseHandler.RegisterRoutes(tripDetail, cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain)
	itineraryHandler.RegisterRoutes(tripDetail, cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain)

	// Admin routes (requires authentication + admin role)
	admin := v1.Group("/admin")
	admin.Use(middleware.Auth(cfg.Clerk.SecretKey, cfg.Clerk.JWTIssuerDomain))
	admin.Use(middleware.RequireAdmin())
	{
		// Stats endpoints
		admin.GET("/stats/overview", adminStatsHandler.GetOverviewStats)
		admin.GET("/stats/user-growth", adminStatsHandler.GetUserGrowthChart)

		// User management
		admin.GET("/users", adminUserHandler.ListUsers)
		admin.PUT("/users/:id/ban", adminUserHandler.BanUser)
		admin.PUT("/users/:id/unban", adminUserHandler.UnbanUser)

		// Trip management
		admin.GET("/trips", adminTripHandler.ListTrips)
		admin.DELETE("/trips/:id", adminTripHandler.DeleteTrip)

		// System health
		admin.GET("/system/health", adminSystemHandler.GetSystemHealth)
	}

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	log.Printf("Environment: %s", cfg.Server.Environment)
	log.Printf("Tracing: %v (%s)", cfg.OTEL.Enabled, cfg.OTEL.ExporterType)
	log.Printf("Metrics: %v", cfg.OTEL.MetricsEnabled)
	log.Printf("Logging: level=%s, format=%s", cfg.OTEL.LogLevel, cfg.OTEL.LogFormat)

	// Start server in goroutine
	go func() {
		if err := router.Run(addr); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Cleanup
	// Note: MGM handles MongoDB connection internally, no explicit disconnect needed
	if err := redisClient.Close(); err != nil {
		log.Printf("Failed to close Redis: %v", err)
	}

	log.Println("Server stopped")
}
