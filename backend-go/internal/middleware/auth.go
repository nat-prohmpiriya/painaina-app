package middleware

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/pkg/clerk"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	clerkClient    *clerk.Client
	userRepository *repository.UserRepository
	isDevelopment  bool
}

func NewAuthMiddleware(clerkSecretKey, clerkIssuer string) (*AuthMiddleware, error) {
	clerkClient, err := clerk.NewClient(clerkSecretKey, clerkIssuer)
	if err != nil {
		return nil, err
	}

	// Check if running in development mode
	env := os.Getenv("ENVIRONMENT")
	isDevelopment := env == "development" || env == "local"

	return &AuthMiddleware{
		clerkClient:    clerkClient,
		userRepository: repository.NewUserRepository(),
		isDevelopment:  isDevelopment,
	}, nil
}

// Auth returns a middleware that validates JWT tokens from Clerk
// and performs JIT (Just-in-Time) user synchronization
func Auth(clerkSecretKey, clerkIssuer string) gin.HandlerFunc {
	authMiddleware, err := NewAuthMiddleware(clerkSecretKey, clerkIssuer)
	if err != nil {
		log.Fatalf("Failed to create auth middleware: %v", err)
	}

	return authMiddleware.RequireAuth()
}

// RequireAuth requires authentication and aborts if not authenticated
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := m.authenticateAndSync(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status": "error",
				"error": gin.H{
					"code":    401,
					"message": err.Error(),
				},
			})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Set("userID", user.ID.Hex())
		c.Set("clerkID", user.ClerkID)
		c.Set("role", user.Role)

		c.Next()
	}
}

// OptionalAuth is like Auth but doesn't require authentication
// It will set user info if valid token is provided, but won't reject if missing
func OptionalAuth(clerkSecretKey, clerkIssuer string) gin.HandlerFunc {
	authMiddleware, err := NewAuthMiddleware(clerkSecretKey, clerkIssuer)
	if err != nil {
		log.Fatalf("Failed to create auth middleware: %v", err)
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		user, err := authMiddleware.authenticateAndSync(c)
		if err != nil {
			// In optional auth, we don't abort on error
			c.Next()
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Set("userID", user.ID.Hex())
		c.Set("clerkID", user.ClerkID)
		c.Set("role", user.Role)

		c.Next()
	}
}

// authenticateAndSync verifies the token and performs JIT user sync
func (m *AuthMiddleware) authenticateAndSync(c *gin.Context) (*models.User, error) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Development mode: Check for X-User-ID header first
	if m.isDevelopment {
		userID := c.GetHeader("X-User-ID")
		if userID != "" {
			log.Printf("🔧 [DEV MODE] Using X-User-ID header: %s", userID)
			user, err := m.userRepository.FindByID(ctx, userID)
			if err != nil {
				log.Printf("⚠️  [DEV MODE] User not found with ID %s: %v", userID, err)
				return nil, err
			}
			if user == nil {
				log.Printf("⚠️  [DEV MODE] User not found with ID %s", userID)
				return nil, http.ErrAbortHandler
			}
			log.Printf("✓ [DEV MODE] Authenticated user: %s (%s)", user.Email, user.ID.Hex())
			return user, nil
		}
	}

	// Standard authentication: Get authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return nil, http.ErrAbortHandler
	}

	// Verify token with Clerk
	userInfo, err := m.clerkClient.VerifyToken(ctx, authHeader)
	if err != nil {
		return nil, err
	}

	// Try to find existing user by Clerk ID
	user, err := m.userRepository.FindByClerkID(ctx, userInfo.ClerkID)
	if err != nil {
		return nil, err
	}

	// JIT Sync: Create user if doesn't exist
	if user == nil {
		// If email is not in token claims, fetch from Clerk API
		if userInfo.Email == "" {
			log.Printf("Email not in JWT claims, fetching from Clerk API for user: %s", userInfo.ClerkID)
			fullUserInfo, err := m.clerkClient.GetUser(ctx, userInfo.ClerkID)
			if err != nil {
				log.Printf("Failed to fetch user from Clerk API: %v", err)
				return nil, err
			}
			userInfo = fullUserInfo
		}

		user = &models.User{
			ClerkID:  userInfo.ClerkID,
			Email:    userInfo.Email,
			Name:     userInfo.FullName,
			Role:     models.UserRoleUser,
		}

		// Add photo URL if available
		if userInfo.ImageURL != "" {
			user.PhotoURL = &userInfo.ImageURL
		}

		// Create user in database (MGM will handle ID, timestamps, and hooks)
		if err := m.userRepository.Create(ctx, user); err != nil {
			log.Printf("Failed to create user during JIT sync: %v", err)
			return nil, err
		}

		log.Printf("✓ Created new user via JIT sync: %s (%s)", user.Email, user.ClerkID)
	}

	return user, nil
}

// GetCurrentUser retrieves the authenticated user from context
func GetCurrentUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}

	u, ok := user.(*models.User)
	return u, ok
}

// GetCurrentUserID retrieves the authenticated user ID from context
func GetCurrentUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		return "", false
	}

	id, ok := userID.(string)
	return id, ok
}

// GetCurrentUserRole retrieves the authenticated user role from context
func GetCurrentUserRole(c *gin.Context) (string, bool) {
	role, exists := c.Get("role")
	if !exists {
		return "", false
	}

	r, ok := role.(string)
	return r, ok
}

// SSEAuth is like Auth but also accepts token from query parameter
// This is needed because EventSource API doesn't support custom headers
func SSEAuth(clerkSecretKey, clerkIssuer string) gin.HandlerFunc {
	authMiddleware, err := NewAuthMiddleware(clerkSecretKey, clerkIssuer)
	if err != nil {
		log.Fatalf("Failed to create auth middleware: %v", err)
	}

	return func(c *gin.Context) {
		// Check for token in query parameter first (for SSE)
		token := c.Query("token")
		if token != "" {
			// Set the Authorization header so authenticateAndSync can use it
			c.Request.Header.Set("Authorization", "Bearer "+token)
		}

		user, err := authMiddleware.authenticateAndSync(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status": "error",
				"error": gin.H{
					"code":    401,
					"message": "Unauthorized",
				},
			})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Set("userID", user.ID.Hex())
		c.Set("clerkID", user.ClerkID)
		c.Set("role", user.Role)

		c.Next()
	}
}
