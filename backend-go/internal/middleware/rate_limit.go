package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a simple in-memory rate limiter using sliding window
type RateLimiter struct {
	requests     map[string][]time.Time
	mu           sync.RWMutex
	maxRequests  int
	windowPeriod time.Duration
}

// NewRateLimiter creates a new rate limiter
// maxRequests: maximum number of requests allowed per windowPeriod
// windowPeriod: time window for rate limiting
func NewRateLimiter(maxRequests int, windowPeriod time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests:     make(map[string][]time.Time),
		maxRequests:  maxRequests,
		windowPeriod: windowPeriod,
	}

	// Start cleanup goroutine
	go rl.cleanup()

	return rl
}

// cleanup removes old entries periodically
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, times := range rl.requests {
			validTimes := make([]time.Time, 0)
			for _, t := range times {
				if now.Sub(t) < rl.windowPeriod {
					validTimes = append(validTimes, t)
				}
			}
			if len(validTimes) == 0 {
				delete(rl.requests, key)
			} else {
				rl.requests[key] = validTimes
			}
		}
		rl.mu.Unlock()
	}
}

// getKey generates a unique key for rate limiting
// Uses IP address + optional user ID for authenticated requests
func (rl *RateLimiter) getKey(c *gin.Context) string {
	// Try to get user ID from context
	if userID, exists := c.Get("userID"); exists {
		return userID.(string)
	}

	// Fall back to IP address
	ip := c.ClientIP()
	return "ip:" + ip
}

// Allow checks if a request is allowed
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.windowPeriod)

	// Get existing request times
	times, exists := rl.requests[key]
	if !exists {
		rl.requests[key] = []time.Time{now}
		return true
	}

	// Filter requests within window
	validTimes := make([]time.Time, 0)
	for _, t := range times {
		if t.After(windowStart) {
			validTimes = append(validTimes, t)
		}
	}

	// Check if under limit
	if len(validTimes) < rl.maxRequests {
		validTimes = append(validTimes, now)
		rl.requests[key] = validTimes
		return true
	}

	rl.requests[key] = validTimes
	return false
}

// Middleware returns a Gin middleware for rate limiting
func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := rl.getKey(c)

		if !rl.Allow(key) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests. Please try again later.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// PlacesAPIRateLimiter creates a rate limiter for Places API endpoints
// Default: 30 requests per minute per user/IP
func PlacesAPIRateLimiter() *RateLimiter {
	return NewRateLimiter(30, time.Minute)
}
