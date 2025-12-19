package services

import (
	"context"
	"fmt"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/pkg/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type AdminService struct {
	userRepo *repository.UserRepository
	tripRepo *repository.TripRepository
	db       *mongo.Database
	tracer   trace.Tracer
}

func NewAdminService(db *mongo.Database) *AdminService {
	return &AdminService{
		userRepo: repository.NewUserRepository(),
		tripRepo: repository.NewTripRepository(),
		db:       db,
		tracer:   otel.Tracer("admin-service"),
	}
}

// ============================================================================
// Overview Stats
// ============================================================================

type OverviewStats struct {
	// User Stats
	TotalUsers         int64 `json:"totalUsers"`
	ActiveUsers        int64 `json:"activeUsers"`        // Users logged in last 30 days
	NewUsersThisMonth  int64 `json:"newUsersThisMonth"`  // Users created this month
	BannedUsers        int64 `json:"bannedUsers"`        // Banned users count

	// Trip Stats
	TotalTrips             int64 `json:"totalTrips"`
	PublicTrips            int64 `json:"publicTrips"`
	PrivateTrips           int64 `json:"privateTrips"`
	TripsCreatedThisMonth  int64 `json:"tripsCreatedThisMonth"`

	// Content Stats
	TotalComments  int64 `json:"totalComments"`
	TotalPhotos    int64 `json:"totalPhotos"`

	// Revenue Stats (Mock for now)
	TotalRevenue      float64 `json:"totalRevenue"`
	RevenueThisMonth  float64 `json:"revenueThisMonth"`
}

func (s *AdminService) GetOverviewStats(ctx context.Context) (*OverviewStats, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetOverviewStats")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	stats := &OverviewStats{}

	// Total Users
	totalUsers, err := s.db.Collection("users").CountDocuments(ctx, bson.M{})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.TotalUsers = totalUsers

	// Active Users (last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	activeUsers, err := s.db.Collection("users").CountDocuments(ctx, bson.M{
		"last_login_at": bson.M{"$gte": thirtyDaysAgo},
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.ActiveUsers = activeUsers

	// New Users This Month
	startOfMonth := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.UTC)
	newUsers, err := s.db.Collection("users").CountDocuments(ctx, bson.M{
		"created_at": bson.M{"$gte": startOfMonth},
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.NewUsersThisMonth = newUsers

	// Banned Users
	bannedUsers, err := s.db.Collection("users").CountDocuments(ctx, bson.M{
		"is_banned": true,
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.BannedUsers = bannedUsers

	// Total Trips
	totalTrips, err := s.db.Collection("trips").CountDocuments(ctx, bson.M{})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.TotalTrips = totalTrips

	// Public Trips
	publicTrips, err := s.db.Collection("trips").CountDocuments(ctx, bson.M{
		"visibility": "public",
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.PublicTrips = publicTrips

	// Private Trips
	privateTrips, err := s.db.Collection("trips").CountDocuments(ctx, bson.M{
		"visibility": bson.M{"$in": []string{"private", "members_only"}},
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.PrivateTrips = privateTrips

	// Trips Created This Month
	tripsThisMonth, err := s.db.Collection("trips").CountDocuments(ctx, bson.M{
		"created_at": bson.M{"$gte": startOfMonth},
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.TripsCreatedThisMonth = tripsThisMonth

	// Total Comments
	totalComments, err := s.db.Collection("comments").CountDocuments(ctx, bson.M{})
	if err != nil {
		logger.Error(err)
		// Non-critical, continue
		stats.TotalComments = 0
	} else {
		stats.TotalComments = totalComments
	}

	// Total Photos
	totalPhotos, err := s.db.Collection("files").CountDocuments(ctx, bson.M{
		"file_type": bson.M{"$regex": "^image/"},
	})
	if err != nil {
		logger.Error(err)
		// Non-critical, continue
		stats.TotalPhotos = 0
	} else {
		stats.TotalPhotos = totalPhotos
	}

	// Revenue Stats (Mock - TravelPayout not implemented yet)
	stats.TotalRevenue = 0
	stats.RevenueThisMonth = 0

	logger.Output(stats)
	return stats, nil
}

// ============================================================================
// User Growth Chart
// ============================================================================

type ChartDataPoint struct {
	Label string `json:"label"` // e.g. "Jan 2025"
	Value int64  `json:"value"` // count
}

func (s *AdminService) GetUserGrowthChart(ctx context.Context, months int) ([]ChartDataPoint, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetUserGrowthChart")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Get data for last N months
	now := time.Now()
	startDate := now.AddDate(0, -months, 0)

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"created_at": bson.M{"$gte": startDate},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"year":  bson.M{"$year": "$created_at"},
				"month": bson.M{"$month": "$created_at"},
			},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"_id.year": 1, "_id.month": 1}}},
	}

	cursor, err := s.db.Collection("users").Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []ChartDataPoint
	for cursor.Next(ctx) {
		var result struct {
			ID struct {
				Year  int `bson:"year"`
				Month int `bson:"month"`
			} `bson:"_id"`
			Count int64 `bson:"count"`
		}

		if err := cursor.Decode(&result); err != nil {
			logger.Error(err)
			continue
		}

		// Format label: "Jan 2025"
		monthName := time.Month(result.ID.Month).String()[:3]
		label := monthName + " " + string(rune(result.ID.Year))

		results = append(results, ChartDataPoint{
			Label: label,
			Value: result.Count,
		})
	}

	logger.Output(results)
	return results, nil
}

// ============================================================================
// User Management
// ============================================================================

type UserListFilter struct {
	Search string // Search by email or name
	Role   string // Filter by role (admin, user)
	Status string // all, active, banned
	Page   int    // Pagination
	Limit  int    // Items per page
}

type UserListResponse struct {
	Users      []models.User `json:"users"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"totalPages"`
}

func (s *AdminService) GetUserList(ctx context.Context, filter UserListFilter) (*UserListResponse, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetUserList")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(filter)

	// Build query
	query := bson.M{}

	// Search filter
	if filter.Search != "" {
		query["$or"] = []bson.M{
			{"email": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"name": bson.M{"$regex": filter.Search, "$options": "i"}},
		}
	}

	// Role filter
	if filter.Role != "" {
		query["role"] = filter.Role
	}

	// Status filter
	if filter.Status == "banned" {
		query["is_banned"] = true
	} else if filter.Status == "active" {
		query["is_banned"] = bson.M{"$ne": true}
	}

	// Count total
	total, err := s.db.Collection("users").CountDocuments(ctx, query)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	skip := (filter.Page - 1) * filter.Limit

	// Find users
	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(filter.Limit))
	findOptions.SetSort(bson.M{"created_at": -1})

	cursor, err := s.db.Collection("users").Find(ctx, query, findOptions)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		logger.Error(err)
		return nil, err
	}

	totalPages := int(total) / filter.Limit
	if int(total)%filter.Limit > 0 {
		totalPages++
	}

	response := &UserListResponse{
		Users:      users,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}

	logger.Output(response)
	return response, nil
}

func (s *AdminService) BanUser(ctx context.Context, userID, adminID, reason string, duration *int) error {
	ctx, span := s.tracer.Start(ctx, "AdminService.BanUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":   userID,
		"adminID":  adminID,
		"reason":   reason,
		"duration": duration,
	})

	// Convert userID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return err
	}

	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"is_banned":  true,
			"banned_at":  now,
			"banned_by":  adminID,
			"ban_reason": reason,
			"updated_at": now,
		},
	}

	if duration != nil {
		update["$set"].(bson.M)["ban_duration"] = *duration
	}

	_, err = s.db.Collection("users").UpdateOne(
		ctx,
		bson.M{"_id": objectID},
		update,
	)

	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output("User banned successfully")
	return nil
}

func (s *AdminService) UnbanUser(ctx context.Context, userID, adminID string) error {
	ctx, span := s.tracer.Start(ctx, "AdminService.UnbanUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":  userID,
		"adminID": adminID,
	})

	// Convert userID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return err
	}

	now := time.Now()
	_, err = s.db.Collection("users").UpdateOne(
		ctx,
		bson.M{"_id": objectID},
		bson.M{
			"$set": bson.M{
				"is_banned":  false,
				"unbanned_at": now,
				"updated_at": now,
			},
		},
	)

	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output("User unbanned successfully")
	return nil
}

// ============================================================================
// Trip Management
// ============================================================================

type TripListFilter struct {
	Search     string // Search by title
	Visibility string // public, private, members_only
	CreatorID  string // Filter by creator
	Type       string // trip, guide
	Status     string // draft, published, archived
	Page       int
	Limit      int
}

type TripListResponse struct {
	Trips      []models.Trip `json:"trips"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"totalPages"`
}

func (s *AdminService) GetTripList(ctx context.Context, filter TripListFilter) (*TripListResponse, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetTripList")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(filter)

	// Build query
	query := bson.M{}

	// Search filter
	if filter.Search != "" {
		query["title"] = bson.M{"$regex": filter.Search, "$options": "i"}
	}

	// Visibility filter
	if filter.Visibility != "" {
		query["visibility"] = filter.Visibility
	}

	// Creator filter
	if filter.CreatorID != "" {
		creatorOID, err := primitive.ObjectIDFromHex(filter.CreatorID)
		if err == nil {
			query["creator_id"] = creatorOID
		}
	}

	// Type filter
	if filter.Type != "" {
		query["type"] = filter.Type
	}

	// Status filter
	if filter.Status != "" {
		query["status"] = filter.Status
	}

	// Count total
	total, err := s.db.Collection("trips").CountDocuments(ctx, query)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	skip := (filter.Page - 1) * filter.Limit

	// Use aggregation pipeline with $lookup to get owner info
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: query}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "owner_id",
			"foreignField": "_id",
			"as":           "owner_data",
		}}},
		{{Key: "$addFields", Value: bson.M{
			"owner": bson.M{
				"$cond": bson.M{
					"if":   bson.M{"$gt": bson.A{bson.M{"$size": "$owner_data"}, 0}},
					"then": bson.M{"$arrayElemAt": bson.A{"$owner_data", 0}},
					"else": nil,
				},
			},
		}}},
		{{Key: "$project", Value: bson.M{
			"owner_data": 0,
		}}},
		{{Key: "$sort", Value: bson.M{"created_at": -1}}},
		{{Key: "$skip", Value: int64(skip)}},
		{{Key: "$limit", Value: int64(filter.Limit)}},
	}

	cursor, err := s.db.Collection("trips").Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var trips []models.Trip
	if err := cursor.All(ctx, &trips); err != nil {
		logger.Error(err)
		return nil, err
	}

	totalPages := int(total) / filter.Limit
	if int(total)%filter.Limit > 0 {
		totalPages++
	}

	response := &TripListResponse{
		Trips:      trips,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}

	logger.Output(response)
	return response, nil
}

func (s *AdminService) DeleteTrip(ctx context.Context, tripID, adminID string) error {
	ctx, span := s.tracer.Start(ctx, "AdminService.DeleteTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":  tripID,
		"adminID": adminID,
	})

	// Convert tripID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return err
	}

	// Delete trip
	_, err = s.db.Collection("trips").DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	// TODO: Also delete related data:
	// - Itineraries
	// - Expenses
	// - Comments
	// - Files
	// For now, just delete the trip

	logger.Output("Trip deleted successfully")
	return nil
}

// ============================================================================
// Place Cache Management
// ============================================================================

type PlaceCacheFilter struct {
	Search string
	Page   int
	Limit  int
}

type PlaceCacheListResponse struct {
	Places     []models.Place `json:"places"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"totalPages"`
}

type PlaceCacheStats struct {
	TotalCached    int64   `json:"totalCached"`
	ExpiredCount   int64   `json:"expiredCount"`
	ValidCount     int64   `json:"validCount"`
	OldestCacheAge string  `json:"oldestCacheAge"` // e.g. "25 days ago"
	CacheSizeMB    float64 `json:"cacheSizeMB"`
}

func (s *AdminService) GetPlaceCacheList(ctx context.Context, filter PlaceCacheFilter) (*PlaceCacheListResponse, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetPlaceCacheList")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(filter)

	// Build query
	query := bson.M{}

	// Search filter
	if filter.Search != "" {
		query["$or"] = []bson.M{
			{"name": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"address": bson.M{"$regex": filter.Search, "$options": "i"}},
			{"google_place_id": bson.M{"$regex": filter.Search, "$options": "i"}},
		}
	}

	// Count total
	total, err := s.db.Collection("places").CountDocuments(ctx, query)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	skip := (filter.Page - 1) * filter.Limit

	// Find places
	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(filter.Limit))
	findOptions.SetSort(bson.M{"updated_at": -1})

	cursor, err := s.db.Collection("places").Find(ctx, query, findOptions)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var places []models.Place
	if err := cursor.All(ctx, &places); err != nil {
		logger.Error(err)
		return nil, err
	}

	totalPages := int(total) / filter.Limit
	if int(total)%filter.Limit > 0 {
		totalPages++
	}

	response := &PlaceCacheListResponse{
		Places:     places,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}

	logger.Output(response)
	return response, nil
}

func (s *AdminService) GetPlaceCacheStats(ctx context.Context) (*PlaceCacheStats, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetPlaceCacheStats")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	stats := &PlaceCacheStats{}

	// Total cached
	totalCached, err := s.db.Collection("places").CountDocuments(ctx, bson.M{})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.TotalCached = totalCached

	// Expired count (older than 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	expiredCount, err := s.db.Collection("places").CountDocuments(ctx, bson.M{
		"updated_at": bson.M{"$lt": thirtyDaysAgo},
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	stats.ExpiredCount = expiredCount
	stats.ValidCount = totalCached - expiredCount

	// Get oldest cache entry
	var oldestPlace models.Place
	findOneOptions := options.FindOne().SetSort(bson.M{"updated_at": 1})
	err = s.db.Collection("places").FindOne(ctx, bson.M{}, findOneOptions).Decode(&oldestPlace)
	if err == nil {
		age := time.Since(oldestPlace.UpdatedAt)
		days := int(age.Hours() / 24)
		if days == 0 {
			stats.OldestCacheAge = "today"
		} else if days == 1 {
			stats.OldestCacheAge = "1 day ago"
		} else {
			stats.OldestCacheAge = fmt.Sprintf("%d days ago", days)
		}
	} else {
		stats.OldestCacheAge = "N/A"
	}

	// Estimate cache size (rough estimate)
	// MongoDB doesn't easily provide collection size, so we estimate
	stats.CacheSizeMB = float64(totalCached) * 0.005 // ~5KB per place

	logger.Output(stats)
	return stats, nil
}

// ============================================================================
// Comment Management
// ============================================================================

type CommentListFilter struct {
	Search     string // Search by content
	TargetType string // trip, place, comment
	UserID     string // Filter by user
	Page       int
	Limit      int
}

type CommentListResponse struct {
	Comments   []CommentWithUserInfo `json:"comments"`
	Total      int64                 `json:"total"`
	Page       int                   `json:"page"`
	Limit      int                   `json:"limit"`
	TotalPages int                   `json:"totalPages"`
}

type CommentWithUserInfo struct {
	models.Comment `bson:",inline"`
	User           *CommentUserInfo `bson:"user,omitempty" json:"user,omitempty"`
}

type CommentUserInfo struct {
	ID       primitive.ObjectID `bson:"_id" json:"id"`
	Name     string             `bson:"name" json:"name"`
	Email    string             `bson:"email" json:"email"`
	PhotoURL *string            `bson:"photo_url,omitempty" json:"photoUrl,omitempty"`
}

func (s *AdminService) GetCommentList(ctx context.Context, filter CommentListFilter) (*CommentListResponse, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetCommentList")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(filter)

	// Build query
	query := bson.M{
		"deleted_at": nil, // Only non-deleted comments
	}

	// Search filter
	if filter.Search != "" {
		query["content"] = bson.M{"$regex": filter.Search, "$options": "i"}
	}

	// Target type filter
	if filter.TargetType != "" {
		query["target_type"] = filter.TargetType
	}

	// User filter
	if filter.UserID != "" {
		userOID, err := primitive.ObjectIDFromHex(filter.UserID)
		if err == nil {
			query["user_id"] = userOID
		}
	}

	// Count total
	total, err := s.db.Collection("comments").CountDocuments(ctx, query)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	skip := (filter.Page - 1) * filter.Limit

	// Aggregation pipeline with user lookup
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: query}},
		{{Key: "$sort", Value: bson.M{"created_at": -1}}},
		{{Key: "$skip", Value: int64(skip)}},
		{{Key: "$limit", Value: int64(filter.Limit)}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$user",
			"preserveNullAndEmptyArrays": true,
		}}},
	}

	cursor, err := s.db.Collection("comments").Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var comments []CommentWithUserInfo
	if err := cursor.All(ctx, &comments); err != nil {
		logger.Error(err)
		return nil, err
	}

	totalPages := int(total) / filter.Limit
	if int(total)%filter.Limit > 0 {
		totalPages++
	}

	response := &CommentListResponse{
		Comments:   comments,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}

	logger.Output(response)
	return response, nil
}

// ============================================================================
// System Health
// ============================================================================

type SystemHealth struct {
	Database string `json:"database"` // healthy, degraded, down
	Redis    string `json:"redis"`
	Storage  string `json:"storage"`
	APIStatus string `json:"apiStatus"`
}

func (s *AdminService) GetSystemHealth(ctx context.Context) (*SystemHealth, error) {
	ctx, span := s.tracer.Start(ctx, "AdminService.GetSystemHealth")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	health := &SystemHealth{
		Database:  "healthy",
		Redis:     "healthy",
		Storage:   "healthy",
		APIStatus: "healthy",
	}

	// Check MongoDB
	err := s.db.Client().Ping(ctx, nil)
	if err != nil {
		health.Database = "down"
		logger.Error(err)
	}

	// TODO: Check Redis (if redis_service is available)
	// TODO: Check Cloudflare R2 (if storage_service is available)

	logger.Output(health)
	return health, nil
}
