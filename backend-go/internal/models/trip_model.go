package models

import (
	"encoding/json"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Trip represents a trip or guide
type Trip struct {
	mgm.DefaultModel `bson:",inline" json:"-"`

	OwnerID        primitive.ObjectID `bson:"owner_id" json:"ownerId"`
	Title          string             `bson:"title" json:"title"`
	Description    *string            `bson:"description,omitempty" json:"description,omitempty"`
	StartDate      time.Time          `bson:"start_date" json:"startDate"`
	EndDate        time.Time          `bson:"end_date" json:"endDate"`
	Destinations   TripDestination    `bson:"destinations" json:"destinations"`
	BudgetTotal    *float64           `bson:"budget_total,omitempty" json:"budgetTotal,omitempty"`
	BudgetCurrency *string            `bson:"budget_currency,omitempty" json:"budgetCurrency,omitempty"`
	TripMembers    []TripMember       `bson:"trip_members,omitempty" json:"tripMembers,omitempty"`
	Status         string             `bson:"status" json:"status"` // draft, published, archived
	Type           string             `bson:"type" json:"type"`     // trip, guide
	CoverPhoto     *string            `bson:"cover_photo,omitempty" json:"coverPhoto,omitempty"`
	Tags           []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	DeletedAt      *time.Time         `bson:"deleted_at,omitempty" json:"deletedAt,omitempty"`

	// Cached counts from Interaction collection
	ViewCount      int     `bson:"view_count" json:"viewCount"`
	ReactionsCount int     `bson:"reactions_count" json:"reactionsCount"` // like + love + angry
	BookmarkCount  int     `bson:"bookmark_count" json:"bookmarkCount"`
	ShareCount     int     `bson:"share_count" json:"shareCount"`
	Level          *string `bson:"level,omitempty" json:"level,omitempty"` // Easy, Moderate, Hard, Expert

	// Aggregated data (populated via lookup)
	Owner *TripUserInfo `bson:"owner,omitempty" json:"owner,omitempty"`
}

// TripUserInfo represents user information in aggregated responses
type TripUserInfo struct {
	ID       primitive.ObjectID `bson:"_id" json:"id"`
	Name     string             `bson:"name" json:"name"`
	PhotoURL *string            `bson:"photo_url,omitempty" json:"photoUrl,omitempty"`
}

// MarshalJSON customizes JSON marshaling to map MongoDB _id to id and use camelCase
func (t Trip) MarshalJSON() ([]byte, error) {
	type Alias Trip
	return json.Marshal(&struct {
		ID        string    `json:"id"`
		CreatedAt time.Time `json:"createdAt"`
		UpdatedAt time.Time `json:"updatedAt"`
		*Alias
	}{
		ID:        t.ID.Hex(),
		CreatedAt: t.CreatedAt,
		UpdatedAt: t.UpdatedAt,
		Alias:     (*Alias)(&t),
	})
}

// TripDestination represents embedded destination information
type TripDestination struct {
	Name        string       `bson:"name" json:"name"`
	Country     string       `bson:"country" json:"country"`
	Address     *string      `bson:"address,omitempty" json:"address,omitempty"`
	Coordinates *Coordinates `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
	PlaceID     *string      `bson:"placeId,omitempty" json:"placeId,omitempty"`
}

type Coordinates struct {
	Lat float64 `bson:"lat" json:"lat"`
	Lng float64 `bson:"lng" json:"lng"`
}

// TripMember represents embedded member information
type TripMember struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID   primitive.ObjectID `bson:"user_id" json:"userId"`
	Role     string             `bson:"role" json:"role"` // owner, editor, viewer
	JoinedAt time.Time          `bson:"joined_at" json:"joinedAt"`
}

// Constants for Trip status
const (
	TripStatusDraft     = "draft"
	TripStatusPublished = "published"
	TripStatusArchived  = "archived"
)

// Constants for Trip type
const (
	TripTypeTrip  = "trip"
	TripTypeGuide = "guide"
)

// Constants for Trip level
const (
	TripLevelEasy     = "Easy"
	TripLevelModerate = "Moderate"
	TripLevelHard     = "Hard"
	TripLevelExpert   = "Expert"
)

// Constants for Member role
const (
	MemberRoleOwner  = "owner"
	MemberRoleEditor = "editor"
	MemberRoleViewer = "viewer"
)

// CollectionName returns the collection name for Trip
func (t *Trip) CollectionName() string {
	return "trips"
}

// Creating hook is called before creating a trip
func (t *Trip) Creating() error {
	// Set default status if not set
	if t.Status == "" {
		t.Status = TripStatusDraft
	}

	// Set default type if not set
	if t.Type == "" {
		t.Type = TripTypeTrip
	}

	return nil
}

// IsDeleted checks if trip is soft deleted
func (t *Trip) IsDeleted() bool {
	return t.DeletedAt != nil
}

// SoftDelete marks trip as deleted
func (t *Trip) SoftDelete() {
	now := time.Now()
	t.DeletedAt = &now
}

// IncrementViews increments the view count
func (t *Trip) IncrementViews() {
	t.ViewCount++
}

// IncrementReactions increments the reactions count
func (t *Trip) IncrementReactions() {
	t.ReactionsCount++
}

// DecrementReactions decrements the reactions count
func (t *Trip) DecrementReactions() {
	if t.ReactionsCount > 0 {
		t.ReactionsCount--
	}
}

// IncrementBookmarks increments the bookmark count
func (t *Trip) IncrementBookmarks() {
	t.BookmarkCount++
}

// DecrementBookmarks decrements the bookmark count
func (t *Trip) DecrementBookmarks() {
	if t.BookmarkCount > 0 {
		t.BookmarkCount--
	}
}

// IncrementShares increments the share count
func (t *Trip) IncrementShares() {
	t.ShareCount++
}
