package middleware

import (
	"net/http"

	"backend-go/internal/models"

	"github.com/gin-gonic/gin"
)

// RequireAdmin middleware checks if the authenticated user has admin role
// This middleware must be used AFTER Auth middleware
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user role from context (set by Auth middleware)
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status": "error",
				"error": gin.H{
					"code":    401,
					"message": "Unauthorized: User not authenticated",
				},
			})
			c.Abort()
			return
		}

		// Check if role is admin
		userRole, ok := role.(string)
		if !ok || userRole != models.UserRoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{
				"status": "error",
				"error": gin.H{
					"code":    403,
					"message": "Forbidden: Admin access required",
				},
			})
			c.Abort()
			return
		}

		// User is admin, continue
		c.Next()
	}
}

// IsAdmin checks if the current user has admin role
// This is a helper function for use in handlers
func IsAdmin(c *gin.Context) bool {
	role, exists := c.Get("role")
	if !exists {
		return false
	}

	userRole, ok := role.(string)
	return ok && userRole == models.UserRoleAdmin
}
