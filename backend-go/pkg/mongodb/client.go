package mongodb

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Client wraps MongoDB client (kept for backward compatibility)
type Client struct {
	*mongo.Client
	Database *mongo.Database
}

// InitMGM initializes MGM with MongoDB connection
func InitMGM(uri, database string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Setup MGM config with proper Config struct
	config := &mgm.Config{
		CtxTimeout: 10 * time.Second,
	}

	err := mgm.SetDefaultConfig(config, database, options.Client().ApplyURI(uri))
	if err != nil {
		return fmt.Errorf("failed to setup MGM config: %w", err)
	}

	// Test connection by pinging
	_, client, _, err := mgm.DefaultConfigs()
	if err != nil {
		return fmt.Errorf("failed to get MGM configs: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	return nil
}

// Connect creates a new MongoDB connection (legacy, kept for backward compatibility)
func Connect(uri, database string, maxPoolSize, timeout int) (*Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	defer cancel()

	// Set client options
	clientOptions := options.Client().
		ApplyURI(uri).
		SetMaxPoolSize(uint64(maxPoolSize))

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	return &Client{
		Client:   client,
		Database: client.Database(database),
	}, nil
}

// Disconnect closes MongoDB connection
func (c *Client) Disconnect(ctx context.Context) error {
	return c.Client.Disconnect(ctx)
}

// Collection returns a collection handle
func (c *Client) Collection(name string) *mongo.Collection {
	return c.Database.Collection(name)
}

// GetDB returns the default MGM database
func GetDB() *mongo.Database {
	_, _, db, _ := mgm.DefaultConfigs()
	return db
}

// EnsureIndexes creates required indexes for all collections
func EnsureIndexes(ctx context.Context) error {
	db := GetDB()

	// ==================== USERS ====================
	usersCollection := db.Collection("users")

	// Unique index on clerk_id
	if _, err := usersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "clerk_id", Value: 1}},
		Options: options.Index().SetUnique(true).SetSparse(true),
	}); err != nil {
		return fmt.Errorf("failed to create index on users.clerk_id: %w", err)
	}

	// Index on email
	if _, err := usersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "email", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on users.email: %w", err)
	}
	log.Println("✓ Created indexes on users collection")

	// ==================== TRIPS ====================
	tripsCollection := db.Collection("trips")

	// Index on owner_id
	if _, err := tripsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "owner_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on trips.owner_id: %w", err)
	}

	// Index on trip_members.user_id
	if _, err := tripsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "trip_members.user_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on trips.trip_members.user_id: %w", err)
	}

	// Compound index on status + deleted_at
	if _, err := tripsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "status", Value: 1},
			{Key: "deleted_at", Value: 1},
		},
	}); err != nil {
		return fmt.Errorf("failed to create compound index on trips.status+deleted_at: %w", err)
	}

	// Index on created_at for sorting
	if _, err := tripsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "created_at", Value: -1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on trips.created_at: %w", err)
	}
	log.Println("✓ Created indexes on trips collection")

	// ==================== COMMENTS ====================
	commentsCollection := db.Collection("comments")

	// Compound index on target_id + target_type + deleted_at
	if _, err := commentsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "target_id", Value: 1},
			{Key: "target_type", Value: 1},
			{Key: "deleted_at", Value: 1},
		},
	}); err != nil {
		return fmt.Errorf("failed to create compound index on comments: %w", err)
	}

	// Index on user_id
	if _, err := commentsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on comments.user_id: %w", err)
	}

	// Index on parent_id for replies
	if _, err := commentsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "parent_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on comments.parent_id: %w", err)
	}
	log.Println("✓ Created indexes on comments collection")

	// ==================== NOTIFICATIONS ====================
	notificationsCollection := db.Collection("notifications")

	// Compound index on recipient_id + is_read
	if _, err := notificationsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "recipient_id", Value: 1},
			{Key: "is_read", Value: 1},
		},
	}); err != nil {
		return fmt.Errorf("failed to create compound index on notifications: %w", err)
	}

	// Index on created_at for sorting
	if _, err := notificationsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "created_at", Value: -1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on notifications.created_at: %w", err)
	}
	log.Println("✓ Created indexes on notifications collection")

	// ==================== CHECKINS ====================
	checkinsCollection := db.Collection("checkins")

	// Index on user_id
	if _, err := checkinsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on checkins.user_id: %w", err)
	}

	// Unique compound index on user_id + city_id (prevent duplicate checkins)
	if _, err := checkinsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "user_id", Value: 1},
			{Key: "city_id", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	}); err != nil {
		return fmt.Errorf("failed to create unique compound index on checkins: %w", err)
	}
	log.Println("✓ Created indexes on checkins collection")

	// ==================== ITINERARIES ====================
	itinerariesCollection := db.Collection("itineraries")

	// Index on trip_id
	if _, err := itinerariesCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "trip_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on itineraries.trip_id: %w", err)
	}
	log.Println("✓ Created indexes on itineraries collection")

	// ==================== ITINERARY_ENTRIES ====================
	entriesCollection := db.Collection("itinerary_entries")

	// Index on itinerary_id
	if _, err := entriesCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "itinerary_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on itinerary_entries.itinerary_id: %w", err)
	}
	log.Println("✓ Created indexes on itinerary_entries collection")

	// ==================== PLACES ====================
	placesCollection := db.Collection("places")

	// Unique index on google_place_id
	if _, err := placesCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "google_place_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	}); err != nil {
		return fmt.Errorf("failed to create unique index on places.google_place_id: %w", err)
	}

	// Index on cache_expires_at for finding expired cache
	if _, err := placesCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "cache_expires_at", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on places.cache_expires_at: %w", err)
	}
	log.Println("✓ Created indexes on places collection")

	// ==================== EXPENSES ====================
	expensesCollection := db.Collection("expenses")

	// Index on trip_id
	if _, err := expensesCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "trip_id", Value: 1}},
	}); err != nil {
		return fmt.Errorf("failed to create index on expenses.trip_id: %w", err)
	}
	log.Println("✓ Created indexes on expenses collection")

	log.Println("✓ All database indexes created successfully")
	return nil
}
