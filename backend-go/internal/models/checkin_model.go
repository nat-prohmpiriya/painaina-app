package models

import (
	"time"

	"github.com/kamva/mgm/v3"
)

// CheckIn represents a user's visited location
type CheckIn struct {
	mgm.DefaultModel `bson:",inline"`

	// User reference
	UserID string `bson:"user_id" json:"userId"`

	// Location (hierarchical)
	CountryCode string  `bson:"country_code" json:"countryCode"` // "JP", "TH"
	Country     string  `bson:"country" json:"country"`          // "Japan", "Thailand"
	CountryFlag string  `bson:"country_flag" json:"countryFlag"` // emoji flag
	RegionID    *string `bson:"region_id,omitempty" json:"regionId,omitempty"`
	Region      *string `bson:"region,omitempty" json:"region,omitempty"`
	CityID      string  `bson:"city_id" json:"cityId"`
	City        string  `bson:"city" json:"city"`

	// Coordinates (for map display)
	Location GeoPoint `bson:"location" json:"location"`

	// Metadata
	VisitedAt time.Time `bson:"visited_at" json:"visitedAt"` // When user visited
	Note      *string   `bson:"note,omitempty" json:"note,omitempty"`
	Photos    []string  `bson:"photos,omitempty" json:"photos,omitempty"`
	TripID    *string   `bson:"trip_id,omitempty" json:"tripId,omitempty"` // Optional link to trip
}

// CollectionName returns the collection name for CheckIn model
func (c *CheckIn) CollectionName() string {
	return "checkins"
}

// Creating hook is called before creating a check-in
func (c *CheckIn) Creating() error {
	// Set default visited date to now if not provided
	if c.VisitedAt.IsZero() {
		c.VisitedAt = time.Now()
	}

	// Initialize empty photos array if nil
	if c.Photos == nil {
		c.Photos = []string{}
	}

	return nil
}

// CheckInStats represents aggregated check-in statistics for a user
type CheckInStats struct {
	TotalCountries int            `json:"totalCountries"`
	TotalCities    int            `json:"totalCities"`
	Countries      []CountryStat  `json:"countries"`
}

// CountryStat represents check-in count per country
type CountryStat struct {
	CountryCode string `json:"countryCode"`
	Country     string `json:"country"`
	Flag        string `json:"flag"`
	CitiesCount int    `json:"citiesCount"`
}
