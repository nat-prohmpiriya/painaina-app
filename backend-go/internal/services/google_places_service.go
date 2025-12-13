package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"backend-go/internal/config"
	"backend-go/pkg/utils"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type GooglePlacesService struct {
	apiKey     string
	httpClient *http.Client
	baseURL    string
	tracer     trace.Tracer
}

func NewGooglePlacesService(cfg *config.GoogleConfig) *GooglePlacesService {
	return &GooglePlacesService{
		apiKey:     cfg.PlacesAPIKey,
		httpClient: &http.Client{},
		baseURL:    "https://maps.googleapis.com/maps/api/place",
		tracer:     otel.Tracer("google-places-service"),
	}
}

// AutocompleteResponse represents response from Places Autocomplete API
type AutocompleteResponse struct {
	Predictions []Prediction `json:"predictions"`
	Status      string       `json:"status"`
}

type Prediction struct {
	PlaceID              string               `json:"place_id"` // Google API uses snake_case
	Description          string               `json:"description"`
	Name                 string               `json:"name"` // For frontend (mainText)
	Types                []string             `json:"types"`
	StructuredFormatting StructuredFormatting `json:"structured_formatting"` // Google API uses snake_case
	Location             *Coordinates         `json:"location,omitempty"` // Add coordinates for frontend
	Source               string               `json:"source"` // "in-memory" or "google"
}

type StructuredFormatting struct {
	MainText      string `json:"main_text"`      // Google API uses snake_case
	SecondaryText string `json:"secondary_text"` // Google API uses snake_case
}

// MarshalJSON converts to camelCase for frontend
func (p Prediction) MarshalJSON() ([]byte, error) {
	result := map[string]interface{}{
		"placeId":     p.PlaceID,
		"description": p.Description,
		"name":        p.Name,
		"types":       p.Types,
		"structuredFormatting": map[string]string{
			"mainText":      p.StructuredFormatting.MainText,
			"secondaryText": p.StructuredFormatting.SecondaryText,
		},
	}

	// Add location if present
	if p.Location != nil {
		result["location"] = map[string]float64{
			"lat": p.Location.Lat,
			"lng": p.Location.Lng,
		}
	}

	return json.Marshal(result)
}

// PlaceDetailsResponse represents response from Place Details API
type PlaceDetailsResponse struct {
	Result PlaceDetailsResult `json:"result"`
	Status string             `json:"status"`
}

type PlaceDetailsResult struct {
	PlaceID          string                   `json:"place_id"`
	Name             string                   `json:"name"`
	FormattedAddress string                   `json:"formatted_address"`
	Geometry         Geometry                 `json:"geometry"`
	FormattedPhoneNumber *string              `json:"formatted_phone_number,omitempty"`
	Website          *string                  `json:"website,omitempty"`
	Rating           *float64                 `json:"rating,omitempty"`
	UserRatingsTotal *int                     `json:"user_ratings_total,omitempty"`
	PriceLevel       *int                     `json:"price_level,omitempty"`
	EditorialSummary *EditorialSummary        `json:"editorial_summary,omitempty"`
	Reviews          []Review                 `json:"reviews,omitempty"`
	Types            []string                 `json:"types"`
	Photos           []Photo                  `json:"photos,omitempty"`
	OpeningHours     *OpeningHoursDetail      `json:"opening_hours,omitempty"`
}

type Geometry struct {
	Location Location `json:"location"`
}

type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Photo struct {
	PhotoReference string `json:"photo_reference"`
	Width          int    `json:"width"`
	Height         int    `json:"height"`
}

type OpeningHoursDetail struct {
	OpenNow     bool     `json:"open_now"`
	WeekdayText []string `json:"weekday_text,omitempty"`
}

type EditorialSummary struct {
	Overview string `json:"overview"`
	Language string `json:"language,omitempty"`
}

type Review struct {
	AuthorName              string  `json:"author_name"`
	AuthorURL               string  `json:"author_url,omitempty"`
	Language                string  `json:"language,omitempty"`
	ProfilePhotoURL         string  `json:"profile_photo_url,omitempty"`
	Rating                  int     `json:"rating"`
	RelativeTimeDescription string  `json:"relative_time_description"`
	Text                    string  `json:"text"`
	Time                    int64   `json:"time"`
}

// PlaceSearchResponse represents response from Places Search API
type PlaceSearchResponse struct {
	Results []PlaceSearchResult `json:"results"`
	Status  string              `json:"status"`
}

type PlaceSearchResult struct {
	PlaceID          string   `json:"place_id"`
	Name             string   `json:"name"`
	FormattedAddress string   `json:"formatted_address"`
	Geometry         Geometry `json:"geometry"`
	Rating           *float64 `json:"rating,omitempty"`
	UserRatingsTotal *int     `json:"user_ratings_total,omitempty"`
	Types            []string `json:"types"`
}

// Autocomplete performs place autocomplete search
func (s *GooglePlacesService) Autocomplete(ctx context.Context, input string, types string) (*AutocompleteResponse, error) {
	ctx, span := s.tracer.Start(ctx, "GooglePlacesService.Autocomplete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"input": input,
		"types": types,
	})

	params := url.Values{}
	params.Add("input", input)
	params.Add("key", s.apiKey)
	params.Add("language", "en") // Force English language response
	if types != "" {
		params.Add("types", types)
	}

	endpoint := fmt.Sprintf("%s/autocomplete/json?%s", s.baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		err := fmt.Errorf("failed to create request: %w", err)
		logger.Error(err)
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		err := fmt.Errorf("failed to call autocomplete API: %w", err)
		logger.Error(err)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		err := fmt.Errorf("failed to read response: %w", err)
		logger.Error(err)
		return nil, err
	}

	var result AutocompleteResponse
	if err := json.Unmarshal(body, &result); err != nil {
		err := fmt.Errorf("failed to parse response: %w", err)
		logger.Error(err)
		return nil, err
	}

	if result.Status != "OK" && result.Status != "ZERO_RESULTS" {
		err := fmt.Errorf("API error: %s", result.Status)
		logger.Error(err)
		return nil, err
	}

	// Populate name field from mainText if empty
	for i := range result.Predictions {
		if result.Predictions[i].Name == "" {
			result.Predictions[i].Name = result.Predictions[i].StructuredFormatting.MainText
		}
	}

	logger.Output(map[string]interface{}{
		"status": result.Status,
		"count":  len(result.Predictions),
	})
	return &result, nil
}

// AutocompleteCity performs city autocomplete (regions only)
func (s *GooglePlacesService) AutocompleteCity(ctx context.Context, input string) (*AutocompleteResponse, error) {
	ctx, span := s.tracer.Start(ctx, "GooglePlacesService.AutocompleteCity")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"input": input,
	})

	result, err := s.Autocomplete(ctx, input, "(regions)")
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(result.Predictions),
	})
	return result, nil
}

// GetPlaceDetails fetches detailed information about a place
func (s *GooglePlacesService) GetPlaceDetails(ctx context.Context, placeID string) (*PlaceDetailsResponse, error) {
	ctx, span := s.tracer.Start(ctx, "GooglePlacesService.GetPlaceDetails")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"placeID": placeID,
	})

	params := url.Values{}
	params.Add("place_id", placeID)
	params.Add("key", s.apiKey)
	// Request Basic tier + Atmosphere tier fields (rating, reviews, etc.)
	// Cost: $22/1000 requests after 10K free tier
	params.Add("fields", "place_id,name,formatted_address,geometry,types,photos,rating,user_ratings_total,editorial_summary,reviews")

	endpoint := fmt.Sprintf("%s/details/json?%s", s.baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		err := fmt.Errorf("failed to create request: %w", err)
		logger.Error(err)
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		err := fmt.Errorf("failed to call details API: %w", err)
		logger.Error(err)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		err := fmt.Errorf("failed to read response: %w", err)
		logger.Error(err)
		return nil, err
	}

	var result PlaceDetailsResponse
	if err := json.Unmarshal(body, &result); err != nil {
		err := fmt.Errorf("failed to parse response: %w", err)
		logger.Error(err)
		return nil, err
	}

	if result.Status != "OK" {
		err := fmt.Errorf("API error: %s", result.Status)
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"placeID": result.Result.PlaceID,
		"name":    result.Result.Name,
	})
	return &result, nil
}

// SearchPlaces searches for places using text query
func (s *GooglePlacesService) SearchPlaces(ctx context.Context, query string) (*PlaceSearchResponse, error) {
	ctx, span := s.tracer.Start(ctx, "GooglePlacesService.SearchPlaces")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"query": query,
	})

	params := url.Values{}
	params.Add("query", query)
	params.Add("key", s.apiKey)

	endpoint := fmt.Sprintf("%s/textsearch/json?%s", s.baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		err := fmt.Errorf("failed to create request: %w", err)
		logger.Error(err)
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		err := fmt.Errorf("failed to call search API: %w", err)
		logger.Error(err)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		err := fmt.Errorf("failed to read response: %w", err)
		logger.Error(err)
		return nil, err
	}

	var result PlaceSearchResponse
	if err := json.Unmarshal(body, &result); err != nil {
		err := fmt.Errorf("failed to parse response: %w", err)
		logger.Error(err)
		return nil, err
	}

	if result.Status != "OK" && result.Status != "ZERO_RESULTS" {
		err := fmt.Errorf("API error: %s", result.Status)
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"status": result.Status,
		"count":  len(result.Results),
	})
	return &result, nil
}

// GetPhotoURL generates a photo URL from photo reference
func (s *GooglePlacesService) GetPhotoURL(photoReference string, maxWidth int) string {
	if maxWidth == 0 {
		maxWidth = 400
	}
	return fmt.Sprintf("%s/photo?maxwidth=%d&photo_reference=%s&key=%s",
		s.baseURL, maxWidth, photoReference, s.apiKey)
}

// GetReviews fetches reviews for a place (from Google)
func (s *GooglePlacesService) GetReviews(ctx context.Context, placeID string) ([]map[string]interface{}, error) {
	ctx, span := s.tracer.Start(ctx, "GooglePlacesService.GetReviews")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"placeID": placeID,
	})

	params := url.Values{}
	params.Add("place_id", placeID)
	params.Add("key", s.apiKey)
	params.Add("fields", "reviews")

	endpoint := fmt.Sprintf("%s/details/json?%s", s.baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		err := fmt.Errorf("failed to create request: %w", err)
		logger.Error(err)
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		err := fmt.Errorf("failed to call reviews API: %w", err)
		logger.Error(err)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		err := fmt.Errorf("failed to read response: %w", err)
		logger.Error(err)
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		err := fmt.Errorf("failed to parse response: %w", err)
		logger.Error(err)
		return nil, err
	}

	status := result["status"].(string)
	if status != "OK" {
		err := fmt.Errorf("API error: %s", status)
		logger.Error(err)
		return nil, err
	}

	// Extract reviews
	resultData := result["result"].(map[string]interface{})
	reviews, ok := resultData["reviews"].([]interface{})
	if !ok {
		logger.Output(map[string]interface{}{
			"count": 0,
		})
		return []map[string]interface{}{}, nil
	}

	// Convert to proper format
	reviewsList := make([]map[string]interface{}, 0)
	for _, review := range reviews {
		if r, ok := review.(map[string]interface{}); ok {
			reviewsList = append(reviewsList, r)
		}
	}

	logger.Output(map[string]interface{}{
		"count": len(reviewsList),
	})
	return reviewsList, nil
}

// NormalizeTypes converts Google Place types to our internal categories
func NormalizeTypes(types []string) []string {
	// Map common Google types to simpler categories
	categoryMap := map[string]string{
		"restaurant":         "restaurant",
		"cafe":               "cafe",
		"bar":                "bar",
		"lodging":            "hotel",
		"tourist_attraction": "attraction",
		"museum":             "museum",
		"park":               "park",
		"shopping_mall":      "shopping",
		"airport":            "transport",
		"train_station":      "transport",
		"hospital":           "health",
		"pharmacy":           "health",
	}

	normalized := make([]string, 0)
	seen := make(map[string]bool)

	for _, t := range types {
		category, exists := categoryMap[t]
		if exists && !seen[category] {
			normalized = append(normalized, category)
			seen[category] = true
		}
	}

	// If no match, keep original types (limit to 5)
	if len(normalized) == 0 {
		for i, t := range types {
			if i >= 5 {
				break
			}
			if !strings.HasPrefix(t, "political") && t != "locality" {
				normalized = append(normalized, t)
			}
		}
	}

	return normalized
}
