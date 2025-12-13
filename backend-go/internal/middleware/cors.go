package middleware

import (
	"backend-go/internal/config"

	"github.com/gin-gonic/gin"
)

// CORS returns a middleware that handles CORS
func CORS(cfg *config.CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range cfg.AllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}

		if allowed {
			if origin != "" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else if len(cfg.AllowedOrigins) > 0 {
				c.Writer.Header().Set("Access-Control-Allow-Origin", cfg.AllowedOrigins[0])
			}
		}

		// Set allowed methods
		methods := ""
		for i, method := range cfg.AllowedMethods {
			if i > 0 {
				methods += ", "
			}
			methods += method
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", methods)

		// Set allowed headers
		headers := ""
		for i, header := range cfg.AllowedHeaders {
			if i > 0 {
				headers += ", "
			}
			headers += header
		}
		c.Writer.Header().Set("Access-Control-Allow-Headers", headers)

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		// Handle preflight OPTIONS requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
