package services

import (
	"context"
	"fmt"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/pkg/utils"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type PlaceService struct {
	placeRepo    *repository.PlaceRepository
	googlePlaces *GooglePlacesService
	cityService  *InMemoryCityService
	tracer       trace.Tracer
}

func NewPlaceService(cfg *config.GoogleConfig, cityService *InMemoryCityService) *PlaceService {
	return &PlaceService{
		placeRepo:    repository.NewPlaceRepository(),
		googlePlaces: NewGooglePlacesService(cfg),
		cityService:  cityService,
		tracer:       otel.Tracer("place-service"),
	}
}

// Autocomplete performs place autocomplete with caching
func (s *PlaceService) Autocomplete(ctx context.Context, input string, types string) (*AutocompleteResponse, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.Autocomplete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"input": input,
		"types": types,
	})

	// Autocomplete is fast and changes frequently, so we don't cache it
	response, err := s.googlePlaces.Autocomplete(ctx, input, types)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(response.Predictions)})
	return response, nil
}

// AutocompleteCity performs city autocomplete using in-memory cache
func (s *PlaceService) AutocompleteCity(ctx context.Context, input string) (*AutocompleteResponse, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.AutocompleteCity")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"input": input})

	// Search in-memory cities (fast, free)
	cities := s.cityService.Search(ctx, input)

	if len(cities) > 0 {
		// Deduplicate cities by name+country (prefer cities over states/countries)
		seenPlaces := make(map[string]bool)
		uniqueCities := make([]City, 0, len(cities))

		for _, city := range cities {
			key := city.Name + "|" + city.Country
			if !seenPlaces[key] {
				seenPlaces[key] = true
				uniqueCities = append(uniqueCities, city)
			}
		}

		// Convert City to Prediction format
		predictions := make([]Prediction, 0, len(uniqueCities))
		for _, city := range uniqueCities {
			predictions = append(predictions, Prediction{
				PlaceID:     city.ID,
				Description: city.Name + ", " + city.Country,
				Name:        city.Name, // For frontend
				Types:       []string{"locality", "political"},
				Location:    &city.Coordinates, // Add coordinates from city data
				Source:      "in-memory",       // Mark as in-memory source
				StructuredFormatting: StructuredFormatting{
					MainText:      city.Name,
					SecondaryText: city.Country,
				},
			})
		}

		logger.Output(map[string]interface{}{
			"count":  len(predictions),
			"source": "in-memory",
		})

		return &AutocompleteResponse{
			Predictions: predictions,
			Status:      "OK",
		}, nil
	}

	// Fallback to Google Places (if no results from in-memory)
	logger.Info("Fallback to Google Places API")
	response, err := s.googlePlaces.AutocompleteCity(ctx, input)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Mark all predictions as from Google source and set Name from MainText
	for i := range response.Predictions {
		response.Predictions[i].Source = "google"
		response.Predictions[i].Name = response.Predictions[i].StructuredFormatting.MainText
	}

	logger.Output(map[string]interface{}{
		"count":  len(response.Predictions),
		"source": "google",
	})
	return response, nil
}

// GetPlaceByGoogleID gets place details with cache-first strategy
func (s *PlaceService) GetPlaceByGoogleID(ctx context.Context, googlePlaceID string) (*models.Place, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.GetPlaceByGoogleID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"googlePlaceID": googlePlaceID})

	// 1. Check cache first
	cachedPlace, err := s.placeRepo.FindByGooglePlaceID(ctx, googlePlaceID)
	if err != nil && err.Error() != "mongo: no documents in result" {
		// Only return error if it's not "not found" error
		err := fmt.Errorf("failed to query cache: %w", err)
		logger.Error(err)
		return nil, err
	}

	// 2. If cache exists and is valid, return it
	if cachedPlace != nil && s.isCacheValid(cachedPlace) {
		logger.Output(map[string]interface{}{"source": "cache"})
		return cachedPlace, nil
	}

	// 3. Cache miss or expired - fetch from Google
	details, err := s.googlePlaces.GetPlaceDetails(ctx, googlePlaceID)
	if err != nil {
		err := fmt.Errorf("failed to fetch from Google: %w", err)
		logger.Error(err)
		return nil, err
	}

	// 4. Convert to our model
	place := s.convertDetailsToPlace(details.Result)

	// 5. Update or create cache
	if cachedPlace != nil {
		// Update existing cache
		place.ID = cachedPlace.ID
		if err := s.placeRepo.Update(ctx, place); err != nil {
			// Log error but don't fail - we have fresh data from Google
			logger.Warn("Failed to update cache")
		}
	} else {
		// Create new cache entry
		if err := s.placeRepo.Create(ctx, place); err != nil {
			// Log error but don't fail - we have fresh data from Google
			logger.Warn("Failed to create cache")
		}
	}

	logger.Output(map[string]interface{}{"source": "google", "placeID": place.ID.Hex()})
	return place, nil
}

// GetPlaceByID gets place by MongoDB ID
func (s *PlaceService) GetPlaceByID(ctx context.Context, id string) (*models.Place, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.GetPlaceByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"id": id})

	place, err := s.placeRepo.FindByID(ctx, id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(place)
	return place, nil
}

// SearchPlaces searches places with cache-first strategy
func (s *PlaceService) SearchPlaces(ctx context.Context, query string) ([]*models.Place, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.SearchPlaces")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"query": query})

	// 1. Try cache first
	cachedPlaces, err := s.placeRepo.SearchByName(ctx, query, 0, 20)
	if err == nil && len(cachedPlaces) > 0 {
		logger.Output(map[string]interface{}{"count": len(cachedPlaces), "source": "cache"})
		return cachedPlaces, nil
	}

	// 2. Fetch from Google
	searchResult, err := s.googlePlaces.SearchPlaces(ctx, query)
	if err != nil {
		err := fmt.Errorf("failed to search Google: %w", err)
		logger.Error(err)
		return nil, err
	}

	// 3. Convert and cache results
	places := make([]*models.Place, 0)
	for _, result := range searchResult.Results {
		// Get full details for each result (which will cache them)
		place, err := s.GetPlaceByGoogleID(ctx, result.PlaceID)
		if err != nil {
			// Skip failed places
			continue
		}
		places = append(places, place)
	}

	logger.Output(map[string]interface{}{"count": len(places), "source": "google"})
	return places, nil
}

// GetReviews gets Google reviews for a place
func (s *PlaceService) GetReviews(ctx context.Context, placeID string) ([]map[string]interface{}, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.GetReviews")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"placeID": placeID})

	reviews, err := s.googlePlaces.GetReviews(ctx, placeID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(reviews)})
	return reviews, nil
}

// ListPlaces returns paginated places from cache
func (s *PlaceService) ListPlaces(ctx context.Context, limit, offset int) ([]*models.Place, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.ListPlaces")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"limit":  limit,
		"offset": offset,
	})

	if limit == 0 {
		limit = 20
	}

	places, err := s.placeRepo.List(ctx, int64(offset), int64(limit))
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(places)})
	return places, nil
}

// CreatePlace manually creates a place (for admin)
func (s *PlaceService) CreatePlace(ctx context.Context, place *models.Place) error {
	ctx, span := s.tracer.Start(ctx, "PlaceService.CreatePlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(place)

	err := s.placeRepo.Create(ctx, place)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Place created successfully")
	return nil
}

// UpdatePlace updates a place (for admin)
func (s *PlaceService) UpdatePlace(ctx context.Context, place *models.Place) error {
	ctx, span := s.tracer.Start(ctx, "PlaceService.UpdatePlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"placeID": place.ID.Hex()})

	err := s.placeRepo.Update(ctx, place)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Place updated successfully")
	return nil
}

// DeletePlace deletes a place from cache
func (s *PlaceService) DeletePlace(ctx context.Context, id string) error {
	ctx, span := s.tracer.Start(ctx, "PlaceService.DeletePlace")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"id": id})

	err := s.placeRepo.Delete(ctx, id)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Place deleted successfully")
	return nil
}

// convertDetailsToPlace converts Google Place Details to our model
func (s *PlaceService) convertDetailsToPlace(details PlaceDetailsResult) *models.Place {
	// Convert photos
	photos := make([]models.PlacePhoto, 0)
	for _, photo := range details.Photos {
		photos = append(photos, models.PlacePhoto{
			PhotoReference: photo.PhotoReference,
			Width:          photo.Width,
			Height:         photo.Height,
			URL:            s.googlePlaces.GetPhotoURL(photo.PhotoReference, 800),
		})
	}

	// Convert opening hours
	var openingHours *models.OpeningHours
	if details.OpeningHours != nil {
		openingHours = &models.OpeningHours{
			OpenNow:     details.OpeningHours.OpenNow,
			WeekdayText: details.OpeningHours.WeekdayText,
		}
	}

	// Convert editorial summary
	var editorialSummary *models.EditorialSummary
	if details.EditorialSummary != nil {
		editorialSummary = &models.EditorialSummary{
			Overview: details.EditorialSummary.Overview,
			Language: details.EditorialSummary.Language,
		}
	}

	// Convert reviews
	reviews := make([]models.PlaceReview, 0)
	for _, review := range details.Reviews {
		reviews = append(reviews, models.PlaceReview{
			AuthorName:              review.AuthorName,
			AuthorURL:               review.AuthorURL,
			Language:                review.Language,
			ProfilePhotoURL:         review.ProfilePhotoURL,
			Rating:                  review.Rating,
			RelativeTimeDescription: review.RelativeTimeDescription,
			Text:                    review.Text,
			Time:                    review.Time,
		})
	}

	// Create GeoPoint with GeoJSON format
	location := models.GeoPoint{
		Type:        "Point",
		Coordinates: []float64{details.Geometry.Location.Lng, details.Geometry.Location.Lat},
		Latitude:    details.Geometry.Location.Lat,
		Longitude:   details.Geometry.Location.Lng,
	}

	// Normalize categories
	categories := NormalizeTypes(details.Types)

	place := &models.Place{
		GooglePlaceID:    details.PlaceID,
		Name:             details.Name,
		Address:          details.FormattedAddress,
		Location:         location,
		Phone:            details.FormattedPhoneNumber,
		Website:          details.Website,
		Rating:           details.Rating,
		UserRatingsTotal: details.UserRatingsTotal,
		PriceLevel:       details.PriceLevel,
		EditorialSummary: editorialSummary,
		Reviews:          reviews,
		Categories:       categories,
		Photos:           photos,
		OpeningHours:     openingHours,
		RawData:          map[string]interface{}{"details": details},
	}

	return place
}

// isCacheValid checks if cached place data is still valid (not expired)
func (s *PlaceService) isCacheValid(place *models.Place) bool {
	// Cache validity is 30 days (maximum allowed by Google TOS)
	cacheExpiry := 30 * 24 * time.Hour
	return time.Since(place.UpdatedAt) < cacheExpiry
}

// RefreshCache force refreshes cache for a place
func (s *PlaceService) RefreshCache(ctx context.Context, googlePlaceID string) (*models.Place, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.RefreshCache")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"googlePlaceID": googlePlaceID})

	// Fetch fresh data from Google
	details, err := s.googlePlaces.GetPlaceDetails(ctx, googlePlaceID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	place := s.convertDetailsToPlace(details.Result)

	// Check if exists in cache
	cachedPlace, _ := s.placeRepo.FindByGooglePlaceID(ctx, googlePlaceID)
	if cachedPlace != nil {
		place.ID = cachedPlace.ID
		if err := s.placeRepo.Update(ctx, place); err != nil {
			logger.Error(err)
			return nil, err
		}
	} else {
		if err := s.placeRepo.Create(ctx, place); err != nil {
			logger.Error(err)
			return nil, err
		}
	}

	logger.Output(map[string]interface{}{"placeID": place.ID.Hex()})
	return place, nil
}

// CleanupExpiredCache deletes cached places older than 30 days (for Google TOS compliance)
func (s *PlaceService) CleanupExpiredCache(ctx context.Context) (int64, error) {
	ctx, span := s.tracer.Start(ctx, "PlaceService.CleanupExpiredCache")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Delete places older than 30 days
	maxCacheDuration := 30 * 24 * time.Hour
	deletedCount, err := s.placeRepo.DeleteOlderThan(ctx, maxCacheDuration)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"deletedCount": deletedCount,
	})
	return deletedCount, nil
}

// GetPhotoURL generates a photo URL from photo reference
func (s *PlaceService) GetPhotoURL(photoReference string, maxWidth int) string {
	return s.googlePlaces.GetPhotoURL(photoReference, maxWidth)
}
