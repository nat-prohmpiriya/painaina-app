package mongodb

import (
	"context"
	"fmt"
	"time"

	"github.com/kamva/mgm/v3"
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
