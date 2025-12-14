package schemas

import "time"

// CreateCheckInRequest represents the request to create a check-in
type CreateCheckInRequest struct {
	CountryCode string  `json:"countryCode" validate:"required,len=2"`
	Country     string  `json:"country" validate:"required"`
	CountryFlag string  `json:"countryFlag" validate:"required"`
	RegionID    *string `json:"regionId,omitempty"`
	Region      *string `json:"region,omitempty"`
	CityID      string  `json:"cityId" validate:"required"`
	City        string  `json:"city" validate:"required"`
	Latitude    float64 `json:"latitude" validate:"required"`
	Longitude   float64 `json:"longitude" validate:"required"`
	VisitedAt   string  `json:"visitedAt" validate:"required"` // ISO date string
	Note        *string `json:"note,omitempty"`
	TripID      *string `json:"tripId,omitempty"`
}

// UpdateCheckInRequest represents the request to update a check-in
type UpdateCheckInRequest struct {
	VisitedAt *string  `json:"visitedAt,omitempty"`
	Note      *string  `json:"note,omitempty"`
	Photos    []string `json:"photos,omitempty"`
	TripID    *string  `json:"tripId,omitempty"`
}

// CheckInResponse represents a check-in in API responses
type CheckInResponse struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	CountryCode string    `json:"countryCode"`
	Country     string    `json:"country"`
	CountryFlag string    `json:"countryFlag"`
	RegionID    *string   `json:"regionId,omitempty"`
	Region      *string   `json:"region,omitempty"`
	CityID      string    `json:"cityId"`
	City        string    `json:"city"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	VisitedAt   time.Time `json:"visitedAt"`
	Note        *string   `json:"note,omitempty"`
	Photos      []string  `json:"photos,omitempty"`
	TripID      *string   `json:"tripId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CheckInStatsResponse represents check-in statistics
type CheckInStatsResponse struct {
	TotalCountries int                   `json:"totalCountries"`
	TotalCities    int                   `json:"totalCities"`
	Countries      []CountryStatResponse `json:"countries"`
}

// CountryStatResponse represents check-in count per country
type CountryStatResponse struct {
	CountryCode string `json:"countryCode"`
	Country     string `json:"country"`
	Flag        string `json:"flag"`
	CitiesCount int    `json:"citiesCount"`
}

// CheckInListResponse represents the response for listing check-ins
type CheckInListResponse struct {
	CheckIns []CheckInResponse    `json:"checkins"`
	Stats    CheckInStatsResponse `json:"stats"`
}
