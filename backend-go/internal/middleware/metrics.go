package middleware

import (
	"time"

	"backend-go/pkg/otel"

	"github.com/gin-gonic/gin"
)

// MetricsMiddleware creates a Gin middleware that records HTTP metrics
func MetricsMiddleware(mm *otel.MetricsManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip if metrics manager is nil
		if mm == nil {
			c.Next()
			return
		}

		start := time.Now()

		// Track active requests
		mm.IncrementActiveRequests(c.Request.Context())
		defer mm.DecrementActiveRequests(c.Request.Context())

		// Process request
		c.Next()

		// Record metrics after request completes
		duration := time.Since(start)

		// Use FullPath() to get the route pattern (e.g., /api/v1/trips/:id)
		// instead of the actual path (e.g., /api/v1/trips/123)
		// This prevents high cardinality issues
		path := c.FullPath()
		if path == "" {
			path = "unknown"
		}

		mm.RecordHTTPRequest(
			c.Request.Context(),
			c.Request.Method,
			path,
			c.Writer.Status(),
			duration,
		)
	}
}
