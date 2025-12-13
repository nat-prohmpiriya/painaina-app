package schemas

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CreateTripRequest struct {
	Title          string              `json:"title" binding:"required,min=3,max=200"`
	Description    *string             `json:"description,omitempty" binding:"omitempty,max=2000"`
	StartDate      string              `json:"startDate" binding:"required"` // Date-only format "YYYY-MM-DD"
	EndDate        string              `json:"endDate" binding:"required"`   // Date-only format "YYYY-MM-DD"
	Destination    DestinationRequest  `json:"destination" binding:"required"`
	BudgetTotal    *float64            `json:"budgetTotal,omitempty" binding:"omitempty,min=0"`
	BudgetCurrency *string             `json:"budgetCurrency,omitempty" binding:"omitempty,len=3"`
	CoverPhoto     *string             `json:"coverPhoto,omitempty" binding:"omitempty,url"`
	Tags           []string            `json:"tags,omitempty" binding:"omitempty,dive,min=2,max=30"`
	Type           *string             `json:"type,omitempty" binding:"omitempty,oneof=trip guide"`
	Level          *string             `json:"level,omitempty" binding:"omitempty,oneof=Easy Moderate Hard Expert"`
}

type UpdateTripRequest struct {
	Title          *string             `json:"title,omitempty" binding:"omitempty,min=3,max=200"`
	Description    *string             `json:"description,omitempty" binding:"omitempty,max=2000"`
	StartDate      *string             `json:"startDate,omitempty"` // Date-only format "YYYY-MM-DD"
	EndDate        *string             `json:"endDate,omitempty"`   // Date-only format "YYYY-MM-DD"
	Destination    *DestinationRequest `json:"destination,omitempty"`
	BudgetTotal    *float64            `json:"budgetTotal,omitempty" binding:"omitempty,min=0"`
	BudgetCurrency *string             `json:"budgetCurrency,omitempty" binding:"omitempty,len=3"`
	CoverPhoto     *string             `json:"coverPhoto,omitempty" binding:"omitempty,url"`
	Tags           []string            `json:"tags,omitempty" binding:"omitempty,dive,min=2,max=30"`
	Status         *string             `json:"status,omitempty" binding:"omitempty,oneof=draft published"`
	Level          *string             `json:"level,omitempty" binding:"omitempty,oneof=Easy Moderate Hard Expert"`
}

type DestinationRequest struct {
	Name        string      `json:"name" binding:"required,min=2,max=100"`
	Country     string      `json:"country" binding:"required,min=2,max=100"`
	Address     *string     `json:"address,omitempty" binding:"omitempty,max=500"`
	Coordinates Coordinates `json:"coordinates" binding:"required"`
	PlaceID     *string     `json:"placeId,omitempty"`
}

type Coordinates struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type ListTripsQuery struct {
	Type     string `form:"type" binding:"omitempty,oneof=trip guide"`
	Status   string `form:"status" binding:"omitempty,oneof=draft published"`
	OwnerID  string `form:"ownerId" binding:"omitempty"`
	MemberID string `form:"memberId" binding:"omitempty"`
	Tags     string `form:"tags" binding:"omitempty"`
	Limit    int    `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset   int    `form:"offset" binding:"omitempty,min=0"`
}

// Response schemas for aggregated data

type UserInfo struct {
	ID       string  `json:"id" bson:"_id"`
	Name     string  `json:"name" bson:"name"`
	PhotoURL *string `json:"photoUrl,omitempty" bson:"photo_url,omitempty"`
}

type TripMemberResponse struct {
	ID       primitive.ObjectID `json:"-" bson:"_id"`
	UserID   string             `json:"userId" bson:"user_id"`
	Role     string             `json:"role" bson:"role"`
	JoinedAt time.Time          `json:"joinedAt" bson:"joined_at"`
	User     *UserInfo          `json:"user,omitempty" bson:"user,omitempty"`
}

type TodoResponse struct {
	ID        string `json:"id" bson:"id"`
	Title     string `json:"title" bson:"title"`
	Completed bool   `json:"completed" bson:"completed"`
	Order     int    `json:"order" bson:"order"`
}

type UnsplashPhotoResponse struct {
	ID          string                `json:"id" bson:"id"`
	URLs        UnsplashURLsResponse  `json:"urls" bson:"urls"`
	Description string                `json:"description,omitempty" bson:"description,omitempty"`
	AltText     string                `json:"altText,omitempty" bson:"alt_text,omitempty"`
}

type UnsplashURLsResponse struct {
	Raw     string `json:"raw" bson:"raw"`
	Full    string `json:"full" bson:"full"`
	Regular string `json:"regular" bson:"regular"`
	Small   string `json:"small" bson:"small"`
	Thumb   string `json:"thumb" bson:"thumb"`
}

// PlaceResponse represents complete place data from MongoDB
type PlaceResponse struct {
	ID              *string            `json:"id,omitempty" bson:"_id,omitempty"`
	GooglePlaceID   *string            `json:"googlePlaceId,omitempty" bson:"google_place_id,omitempty"`
	Name            *string            `json:"name,omitempty" bson:"name,omitempty"`
	Address         *string            `json:"address,omitempty" bson:"address,omitempty"`
	Location        interface{}        `json:"location,omitempty" bson:"location,omitempty"`
	Phone           *string            `json:"phone,omitempty" bson:"phone,omitempty"`
	Website         *string            `json:"website,omitempty" bson:"website,omitempty"`
	Rating          *float64           `json:"rating,omitempty" bson:"rating,omitempty"`
	UserRatingsTotal *int              `json:"userRatingsTotal,omitempty" bson:"user_ratings_total,omitempty"`
	PriceLevel      *int               `json:"priceLevel,omitempty" bson:"price_level,omitempty"`
	EditorialSummary interface{}       `json:"editorialSummary,omitempty" bson:"editorial_summary,omitempty"`
	Reviews         interface{}        `json:"reviews,omitempty" bson:"reviews,omitempty"`
	Categories      []string           `json:"categories,omitempty" bson:"categories,omitempty"`
	Photos          interface{}        `json:"photos,omitempty" bson:"photos,omitempty"`
	OpeningHours    interface{}        `json:"openingHours,omitempty" bson:"opening_hours,omitempty"`
	CachedAt        *time.Time         `json:"cachedAt,omitempty" bson:"cached_at,omitempty"`
	CacheExpiresAt  *time.Time         `json:"cacheExpiresAt,omitempty" bson:"cache_expires_at,omitempty"`
}

type ItineraryEntryResponse struct {
	ID             string                   `json:"id" bson:"_id"`
	ItineraryID    string                   `json:"itineraryId" bson:"itinerary_id"`
	Type           string                   `json:"type" bson:"type"`
	Title          string                   `json:"title" bson:"title"`
	Description    *string                  `json:"description,omitempty" bson:"description,omitempty"`
	PlaceID        *string                  `json:"placeId,omitempty" bson:"place_id,omitempty"`
	Place          *PlaceResponse           `json:"place,omitempty" bson:"place,omitempty"` // Populated place data
	StartTime      *string                  `json:"startTime,omitempty" bson:"start_time,omitempty"`
	EndTime        *string                  `json:"endTime,omitempty" bson:"end_time,omitempty"`
	Duration       *int                     `json:"duration,omitempty" bson:"duration,omitempty"`
	Budget         *float64                 `json:"budget,omitempty" bson:"budget,omitempty"`
	Photos         []string                 `json:"photos,omitempty" bson:"photos,omitempty"`
	UnsplashPhotos []UnsplashPhotoResponse  `json:"unsplashPhotos,omitempty" bson:"unsplash_photos,omitempty"`
	Order          int                      `json:"order" bson:"order"`
	Todos          []TodoResponse           `json:"todos,omitempty" bson:"todos,omitempty"`
	CreatedAt      time.Time                `json:"createdAt" bson:"created_at"`
	UpdatedAt      time.Time                `json:"updatedAt" bson:"updated_at"`
}

type ItineraryResponse struct {
	ID        string                    `json:"id" bson:"_id"`
	TripID    string                    `json:"tripId" bson:"trip_id"`
	DayNumber int                       `json:"dayNumber" bson:"day_number"`
	Date      string                    `json:"date" bson:"date"`
	Title     string                    `json:"title" bson:"title"`
	Order     int                       `json:"order" bson:"order"`
	Entries   []ItineraryEntryResponse  `json:"entries,omitempty" bson:"entries,omitempty"`
	CreatedAt time.Time                 `json:"createdAt" bson:"created_at"`
	UpdatedAt time.Time                 `json:"updatedAt" bson:"updated_at"`
}

type ExpenseResponse struct {
	ID          string    `json:"id" bson:"_id"`
	TripID      string    `json:"tripId" bson:"trip_id"`
	EntryID     *string   `json:"entryId,omitempty" bson:"entry_id,omitempty"`
	Description string    `json:"description" bson:"description"`
	Amount      float64   `json:"amount" bson:"amount"`
	Currency    string    `json:"currency" bson:"currency"`
	Category    string    `json:"category" bson:"category"`
	Date        time.Time `json:"date" bson:"date"`
	PaidBy      string    `json:"paidBy" bson:"paid_by"`
	SplitType   string    `json:"splitType" bson:"split_type"`
	SplitWith   []string  `json:"splitWith" bson:"split_with"`
	Status      string    `json:"status" bson:"status"`
	CreatedAt   time.Time `json:"createdAt" bson:"created_at"`
	UpdatedAt   time.Time `json:"updatedAt" bson:"updated_at"`
}

type DestinationResponse struct {
	Name        string       `json:"name" bson:"name"`
	Country     string       `json:"country" bson:"country"`
	Address     *string      `json:"address,omitempty" bson:"address,omitempty"`
	Coordinates *Coordinates `json:"coordinates,omitempty" bson:"coordinates,omitempty"`
	PlaceID     *string      `json:"placeId,omitempty" bson:"place_id,omitempty"`
}

type TripDetailResponse struct {
	ID               string                `json:"id" bson:"_id"`
	OwnerID          string                `json:"ownerId" bson:"owner_id"`
	Title            string                `json:"title" bson:"title"`
	Description      *string               `json:"description,omitempty" bson:"description,omitempty"`
	StartDate        time.Time             `json:"startDate" bson:"start_date"`
	EndDate          time.Time             `json:"endDate" bson:"end_date"`
	Destinations     DestinationResponse   `json:"destinations" bson:"destinations"`
	BudgetTotal      *float64              `json:"budgetTotal,omitempty" bson:"budget_total,omitempty"`
	BudgetCurrency   *string               `json:"budgetCurrency,omitempty" bson:"budget_currency,omitempty"`
	CoverPhoto       *string               `json:"coverPhoto,omitempty" bson:"cover_photo,omitempty"`
	Tags             []string              `json:"tags,omitempty" bson:"tags,omitempty"`
	Status           string                `json:"status" bson:"status"`
	Type             string                `json:"type" bson:"type"`
	Level            *string               `json:"level,omitempty" bson:"level,omitempty"`
	ViewCount        int                   `json:"viewCount" bson:"view_count"`
	ReactionsCount   int                   `json:"reactionsCount" bson:"reactions_count"`
	BookmarkCount    int                   `json:"bookmarkCount" bson:"bookmark_count"`
	ShareCount       int                   `json:"shareCount" bson:"share_count"`
	CreatedAt        time.Time             `json:"createdAt" bson:"created_at"`
	UpdatedAt        time.Time             `json:"updatedAt" bson:"updated_at"`

	// Aggregated data
	Owner        *UserInfo              `json:"owner,omitempty" bson:"owner,omitempty"`
	TripMembers  []TripMemberResponse   `json:"tripMembers,omitempty" bson:"trip_members,omitempty"`
	Itineraries  []ItineraryResponse    `json:"itineraries,omitempty" bson:"itineraries,omitempty"`
	Expenses     []ExpenseResponse      `json:"expenses,omitempty" bson:"expenses,omitempty"`
}
