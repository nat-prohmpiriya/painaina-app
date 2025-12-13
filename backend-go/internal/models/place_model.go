package models

import (
	"time"

	"github.com/kamva/mgm/v3"
)

// Place represents a place/location with Google Places API data cached in MongoDB
type Place struct {
	mgm.DefaultModel `bson:",inline"`

	GooglePlaceID    string                 `bson:"google_place_id" json:"googlePlaceId"` // Unique Google Place ID
	Name             string                 `bson:"name" json:"name"`
	Address          string                 `bson:"address" json:"address"`
	Location         GeoPoint               `bson:"location" json:"location"`
	Phone            *string                `bson:"phone,omitempty" json:"phone,omitempty"`
	Website          *string                `bson:"website,omitempty" json:"website,omitempty"`
	Rating           *float64               `bson:"rating,omitempty" json:"rating,omitempty"`
	UserRatingsTotal *int                   `bson:"user_ratings_total,omitempty" json:"userRatingsTotal,omitempty"`
	PriceLevel       *int                   `bson:"price_level,omitempty" json:"priceLevel,omitempty"` // 0-4 scale
	EditorialSummary *EditorialSummary      `bson:"editorial_summary,omitempty" json:"editorialSummary,omitempty"`
	Reviews          []PlaceReview          `bson:"reviews,omitempty" json:"reviews,omitempty"`
	Categories       []string               `bson:"categories,omitempty" json:"categories,omitempty"` // types from Google
	Photos           []PlacePhoto           `bson:"photos,omitempty" json:"photos,omitempty"`
	OpeningHours     *OpeningHours          `bson:"opening_hours,omitempty" json:"openingHours,omitempty"`
	RawData          map[string]interface{} `bson:"raw_data,omitempty" json:"rawData,omitempty"` // Full Google Place API response
	CachedAt         time.Time              `bson:"cached_at" json:"cachedAt"`                   // When data was cached
	CacheExpiresAt   time.Time              `bson:"cache_expires_at" json:"cacheExpiresAt"`      // Cache expiry time (e.g., 30 days)
}

// GeoPoint represents geographical coordinates
type GeoPoint struct {
	Type        string    `bson:"type" json:"type"`                   // "Point" for GeoJSON
	Coordinates []float64 `bson:"coordinates" json:"coordinates"`     // [longitude, latitude]
	Latitude    float64   `bson:"latitude,omitempty" json:"latitude"` // For easy access
	Longitude   float64   `bson:"longitude,omitempty" json:"longitude"`
}

// PlacePhoto represents a photo reference from Google Places
type PlacePhoto struct {
	PhotoReference string `bson:"photo_reference" json:"photoReference"`
	Width          int    `bson:"width" json:"width"`
	Height         int    `bson:"height" json:"height"`
	URL            string `bson:"url,omitempty" json:"url,omitempty"` // Cached photo URL
}

// OpeningHours represents place opening hours
type OpeningHours struct {
	OpenNow     bool     `bson:"open_now" json:"openNow"`
	WeekdayText []string `bson:"weekday_text,omitempty" json:"weekdayText,omitempty"`
}

// EditorialSummary represents Google's editorial summary
type EditorialSummary struct {
	Overview string `bson:"overview" json:"overview"`
	Language string `bson:"language,omitempty" json:"language,omitempty"`
}

// PlaceReview represents a Google Places review
type PlaceReview struct {
	AuthorName              string `bson:"author_name" json:"authorName"`
	AuthorURL               string `bson:"author_url,omitempty" json:"authorUrl,omitempty"`
	Language                string `bson:"language,omitempty" json:"language,omitempty"`
	ProfilePhotoURL         string `bson:"profile_photo_url,omitempty" json:"profilePhotoUrl,omitempty"`
	Rating                  int    `bson:"rating" json:"rating"`
	RelativeTimeDescription string `bson:"relative_time_description" json:"relativeTimeDescription"`
	Text                    string `bson:"text" json:"text"`
	Time                    int64  `bson:"time" json:"time"`
}

// CollectionName returns the collection name for Place
func (p *Place) CollectionName() string {
	return "places"
}

// IsCacheExpired checks if the cached data is expired
func (p *Place) IsCacheExpired() bool {
	return time.Now().After(p.CacheExpiresAt)
}

// UpdateCache updates the cache timestamp
func (p *Place) UpdateCache(expiryDuration time.Duration) {
	now := time.Now()
	p.CachedAt = now
	p.CacheExpiresAt = now.Add(expiryDuration)
}
