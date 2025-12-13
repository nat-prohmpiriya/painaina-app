package models

import (
	"time"

	"github.com/kamva/mgm/v3"
)

// User represents a user in the system
type User struct {
	mgm.DefaultModel `bson:",inline"`

	// From Clerk (Read-Only)
	ClerkID string `bson:"clerk_id" json:"clerkId"`
	Email   string `bson:"email" json:"email"` // Immutable

	// Editable by user
	Name     string        `bson:"name" json:"name"`
	Bio      *string       `bson:"bio,omitempty" json:"bio,omitempty"`
	PhotoURL *string       `bson:"photo_url,omitempty" json:"photoUrl,omitempty"`
	Settings *UserSettings `bson:"settings,omitempty" json:"settings,omitempty"`

	// System fields
	Role        string     `bson:"role" json:"role"`                                       // admin, user
	LastLoginAt *time.Time `bson:"last_login_at,omitempty" json:"lastLoginAt,omitempty"` // Track user activity

	// Ban Management
	IsBanned    bool       `bson:"is_banned" json:"isBanned"`
	BannedAt    *time.Time `bson:"banned_at,omitempty" json:"bannedAt,omitempty"`
	BannedBy    *string    `bson:"banned_by,omitempty" json:"bannedBy,omitempty"`         // Admin user ID
	BanReason   *string    `bson:"ban_reason,omitempty" json:"banReason,omitempty"`       // Reason for ban
	BanDuration *int       `bson:"ban_duration,omitempty" json:"banDuration,omitempty"`   // Days (null = permanent)
	UnbannedAt  *time.Time `bson:"unbanned_at,omitempty" json:"unbannedAt,omitempty"`     // Track unban history
}

// UserSettings represents user preferences
type UserSettings struct {
	Language      string `bson:"language" json:"language"`           // en, th
	Notifications bool   `bson:"notifications" json:"notifications"` // enable/disable notifications
}

// Constants for User role
const (
	UserRoleAdmin = "admin"
	UserRoleUser  = "user"
)

// CollectionName returns the collection name for User model
func (u *User) CollectionName() string {
	return "users"
}

// Creating hook is called before creating a user
func (u *User) Creating() error {
	// Set default role if not set
	if u.Role == "" {
		u.Role = UserRoleUser
	}

	// Set default settings if not provided
	if u.Settings == nil {
		u.Settings = &UserSettings{
			Language:      "en",
			Notifications: true,
		}
	}

	return nil
}

// Updating hook is called before updating a user
func (u *User) Updating() error {
	// Email should never be updated
	// This is enforced at API level, but adding here as extra safety
	return nil
}
