package services

import (
	"context"
	"log"
	"time"

	"backend-go/internal/config"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	client *redis.Client
	prefix string
}

func NewRedisService(cfg *config.Config) *RedisService {
	// Check if Redis URL is configured
	if cfg.Redis.URL == "" {
		log.Println("⚠ Redis URL not configured, skipping Redis initialization")
		return nil
	}

	// For Upstash, use the REST URL approach or standard Redis protocol
	// Upstash provides both redis:// URL and REST API
	// Using standard Redis protocol with TLS
	opt, err := redis.ParseURL(cfg.Redis.URL)
	if err != nil {
		log.Printf("❌ Failed to parse Redis URL: %v", err)
		return nil
	}

	client := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("❌ Failed to connect to Redis: %v", err)
		return nil
	}

	log.Printf("✓ Redis connected successfully (prefix: %s)", cfg.Redis.Prefix)

	return &RedisService{
		client: client,
		prefix: cfg.Redis.Prefix,
	}
}

// prefixKey adds the environment prefix to a key
func (s *RedisService) prefixKey(key string) string {
	return s.prefix + key
}

// Get retrieves a value from Redis
func (s *RedisService) Get(ctx context.Context, key string) ([]byte, error) {
	val, err := s.client.Get(ctx, s.prefixKey(key)).Bytes()
	if err == redis.Nil {
		return nil, nil // Key does not exist
	}
	if err != nil {
		return nil, err
	}
	return val, nil
}

// Set stores a value in Redis with TTL
func (s *RedisService) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return s.client.Set(ctx, s.prefixKey(key), value, ttl).Err()
}

// Delete removes a key from Redis
func (s *RedisService) Delete(ctx context.Context, key string) error {
	return s.client.Del(ctx, s.prefixKey(key)).Err()
}

// Close closes the Redis connection
func (s *RedisService) Close() error {
	return s.client.Close()
}
