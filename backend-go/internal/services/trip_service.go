package services

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/internal/schemas"
	"backend-go/pkg/utils"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type TripService struct {
	tripRepo      *repository.TripRepository
	userRepo      *repository.UserRepository
	itineraryRepo *repository.ItineraryRepository
	tracer        trace.Tracer
}

func NewTripService() *TripService {
	return &TripService{
		tripRepo:      repository.NewTripRepository(),
		userRepo:      repository.NewUserRepository(),
		itineraryRepo: repository.NewItineraryRepository(),
		tracer:        otel.Tracer("trip-service"),
	}
}

func (s *TripService) CreateTrip(ctx context.Context, userID string, req *schemas.CreateTripRequest) (*models.Trip, error) {
	ctx, span := s.tracer.Start(ctx, "TripService.CreateTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": userID,
		"title":  req.Title,
	})

	// Parse date strings to time.Time (date-only format "YYYY-MM-DD")
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		err := errors.New("invalid start date format, expected YYYY-MM-DD")
		logger.Error(err)
		return nil, err
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		err := errors.New("invalid end date format, expected YYYY-MM-DD")
		logger.Error(err)
		return nil, err
	}

	// Validate business rules
	if startDate.After(endDate) {
		err := errors.New("start date must be before end date")
		logger.Error(err)
		return nil, err
	}

	// Verify user exists
	_, err = s.userRepo.FindByID(ctx, userID)
	if err != nil {
		err := errors.New("user not found")
		logger.Error(err)
		return nil, err
	}

	// Create trip model using repository helper (handles string → ObjectID conversion)
	trip, err := s.tripRepo.NewTrip(userID)
	if err != nil {
		err := errors.New("invalid user ID")
		logger.Error(err)
		return nil, err
	}

	// Set fields
	trip.Title = req.Title
	trip.Description = req.Description
	trip.StartDate = startDate
	trip.EndDate = endDate
	trip.Destinations = models.TripDestination{
		Name:        req.Destination.Name,
		Country:     req.Destination.Country,
		Address:     req.Destination.Address,
		Coordinates: &models.Coordinates{Lat: req.Destination.Coordinates.Lat, Lng: req.Destination.Coordinates.Lng},
		PlaceID:     req.Destination.PlaceID,
	}
	trip.BudgetTotal = req.BudgetTotal
	trip.BudgetCurrency = req.BudgetCurrency
	trip.CoverPhoto = req.CoverPhoto
	trip.Tags = req.Tags
	trip.Status = models.TripStatusDraft
	trip.Type = models.TripTypeTrip
	trip.Level = req.Level

	// Override type if provided
	if req.Type != nil {
		trip.Type = *req.Type
	}

	// Add owner as first member with owner role
	trip.TripMembers = []models.TripMember{
		{
			ID:       primitive.NewObjectID(), // Generate unique ID for member
			UserID:   trip.OwnerID,            // Use already converted OwnerID from NewTrip
			Role:     models.MemberRoleOwner,
			JoinedAt: time.Now(), // Use current time instead of zero value
		},
	}

	// Save to database (MGM will handle ID, timestamps, and hooks)
	if err := s.tripRepo.Create(ctx, trip); err != nil {
		logger.Error(err)
		return nil, err
	}

	// Auto-create itineraries based on trip type
	if err := s.createDefaultItineraries(ctx, trip); err != nil {
		logger.Error(err)
		// Log error but don't fail trip creation
	}

	logger.Output(map[string]interface{}{
		"tripID": trip.ID.Hex(),
		"title":  trip.Title,
	})
	return trip, nil
}

// createDefaultItineraries creates default itineraries based on trip type
func (s *TripService) createDefaultItineraries(ctx context.Context, trip *models.Trip) error {
	if trip.Type == models.TripTypeGuide {
		// For guide: create 1 default itinerary
		itinerary := &models.Itinerary{
			TripID:    trip.ID,
			Date:      trip.StartDate.Format("2006-01-02"),
			DayNumber: 1,
			Title:     "Day 1",
			Order:     1,
		}
		if err := s.itineraryRepo.Create(ctx, itinerary); err != nil {
			return err
		}
	} else {
		// For trip: create itinerary for each day
		currentDate := trip.StartDate
		dayCount := 1

		for !currentDate.After(trip.EndDate) {
			itinerary := &models.Itinerary{
				TripID:    trip.ID,
				Date:      currentDate.Format("2006-01-02"),
				DayNumber: dayCount,
				Title:     "Day " + strconv.Itoa(dayCount),
				Order:     dayCount,
			}
			if err := s.itineraryRepo.Create(ctx, itinerary); err != nil {
				return err
			}

			currentDate = currentDate.AddDate(0, 0, 1) // Add 1 day
			dayCount++
		}
	}

	return nil
}

func (s *TripService) GetTrip(ctx context.Context, tripID string) (*models.Trip, error) {
	ctx, span := s.tracer.Start(ctx, "TripService.GetTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(trip)
	return trip, nil
}

// GetTripWithFullData gets trip with all related data (itineraries, entries, expenses, users) in 1 query
func (s *TripService) GetTripWithFullData(ctx context.Context, tripID string) (*schemas.TripDetailResponse, error) {
	ctx, span := s.tracer.Start(ctx, "TripService.GetTripWithFullData")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	data, err := s.tripRepo.FindByIDWithFullData(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(data)
	return data, nil
}

func (s *TripService) ListTrips(ctx context.Context, query *schemas.ListTripsQuery) ([]*models.Trip, error) {
	ctx, span := s.tracer.Start(ctx, "TripService.ListTrips")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"limit":    query.Limit,
		"offset":   query.Offset,
		"ownerID":  query.OwnerID,
		"memberID": query.MemberID,
		"type":     query.Type,
		"status":   query.Status,
		"tags":     query.Tags,
	})

	// Build filter from query parameters
	filter := &repository.TripFilter{
		Limit:  int64(query.Limit),
		Offset: int64(query.Offset),
	}

	if query.Type != "" {
		filter.Type = &query.Type
	}

	if query.Status != "" {
		filter.Status = &query.Status
	}

	if query.OwnerID != "" {
		filter.OwnerID = &query.OwnerID
	}

	if query.MemberID != "" {
		filter.MemberID = &query.MemberID
	}

	if query.Tags != "" {
		// Parse comma-separated tags
		tags := []string{}
		for _, tag := range strings.Split(query.Tags, ",") {
			trimmed := strings.TrimSpace(tag)
			if trimmed != "" {
				tags = append(tags, trimmed)
			}
		}
		filter.Tags = tags
	}

	// Use dynamic Find method
	trips, err := s.tripRepo.Find(ctx, filter)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(trips),
	})
	return trips, nil
}

func (s *TripService) UpdateTrip(ctx context.Context, tripID, userID string, req *schemas.UpdateTripRequest) (*models.Trip, error) {
	ctx, span := s.tracer.Start(ctx, "TripService.UpdateTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"userID": userID,
	})

	// Get existing trip
	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		err := errors.New("trip not found")
		logger.Error(err)
		return nil, err
	}

	// Verify ownership
	if !s.tripRepo.IsOwner(trip, userID) {
		err := errors.New("unauthorized: you don't own this trip")
		logger.Error(err)
		return nil, err
	}

	// Parse and validate date range if provided
	startDate := trip.StartDate
	endDate := trip.EndDate

	if req.StartDate != nil {
		parsed, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			err := errors.New("invalid start date format, expected YYYY-MM-DD")
			logger.Error(err)
			return nil, err
		}
		startDate = parsed
	}
	if req.EndDate != nil {
		parsed, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			err := errors.New("invalid end date format, expected YYYY-MM-DD")
			logger.Error(err)
			return nil, err
		}
		endDate = parsed
	}

	if startDate.After(endDate) {
		err := errors.New("start date must be before end date")
		logger.Error(err)
		return nil, err
	}

	// Update fields
	if req.Title != nil {
		trip.Title = *req.Title
	}
	if req.Description != nil {
		trip.Description = req.Description
	}
	if req.StartDate != nil {
		trip.StartDate = startDate
	}
	if req.EndDate != nil {
		trip.EndDate = endDate
	}
	if req.Destination != nil {
		trip.Destinations = models.TripDestination{
			Name:        req.Destination.Name,
			Country:     req.Destination.Country,
			Address:     req.Destination.Address,
			Coordinates: &models.Coordinates{Lat: req.Destination.Coordinates.Lat, Lng: req.Destination.Coordinates.Lng},
			PlaceID:     req.Destination.PlaceID,
		}
	}
	if req.BudgetTotal != nil {
		trip.BudgetTotal = req.BudgetTotal
	}
	if req.BudgetCurrency != nil {
		trip.BudgetCurrency = req.BudgetCurrency
	}
	if req.CoverPhoto != nil {
		trip.CoverPhoto = req.CoverPhoto
	}
	if req.Tags != nil {
		trip.Tags = req.Tags
	}
	if req.Status != nil {
		trip.Status = *req.Status
	}
	if req.Level != nil {
		trip.Level = req.Level
	}

	// Update in database
	if err := s.tripRepo.Update(ctx, trip); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(trip)
	return trip, nil
}

func (s *TripService) DeleteTrip(ctx context.Context, tripID, userID string) error {
	ctx, span := s.tracer.Start(ctx, "TripService.DeleteTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"userID": userID,
	})

	// Get existing trip
	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		err := errors.New("trip not found")
		logger.Error(err)
		return err
	}

	// Verify ownership
	if !s.tripRepo.IsOwner(trip, userID) {
		err := errors.New("unauthorized: you don't own this trip")
		logger.Error(err)
		return err
	}

	// Soft delete
	err = s.tripRepo.Delete(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Trip deleted successfully")
	return nil
}

// Trip Members
func (s *TripService) GetTripMembers(ctx context.Context, tripID string) ([]models.TripMember, error) {
	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		return nil, errors.New("trip not found")
	}
	return trip.TripMembers, nil
}

func (s *TripService) AddTripMember(ctx context.Context, tripID, userID string, req *schemas.AddTripMemberRequest) (*models.TripMember, error) {
	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		return nil, errors.New("trip not found")
	}

	// Only owner can add members
	if !s.tripRepo.IsOwner(trip, userID) {
		return nil, errors.New("unauthorized: only owner can add members")
	}

	// Check if user is already a member
	if s.tripRepo.IsMemberExists(trip, req.UserID) {
		return nil, errors.New("user is already a member")
	}

	// Create new member using repository helper
	member, err := s.tripRepo.NewTripMember(req.UserID, req.Role)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	trip.TripMembers = append(trip.TripMembers, *member)
	if err := s.tripRepo.Update(ctx, trip); err != nil {
		return nil, err
	}

	return member, nil
}

func (s *TripService) UpdateTripMember(ctx context.Context, tripID, memberID, userID string, req *schemas.UpdateTripMemberRequest) (*models.TripMember, error) {
	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		return nil, errors.New("trip not found")
	}

	// Only owner can update members
	if !s.tripRepo.IsOwner(trip, userID) {
		return nil, errors.New("unauthorized: only owner can update members")
	}

	// Find member using repository helper
	_, index, err := s.tripRepo.FindMemberByID(trip, memberID)
	if err != nil {
		return nil, err
	}

	// Update role
	trip.TripMembers[index].Role = req.Role

	if err := s.tripRepo.Update(ctx, trip); err != nil {
		return nil, err
	}

	return &trip.TripMembers[index], nil
}

func (s *TripService) DeleteTripMember(ctx context.Context, tripID, memberID, userID string) error {
	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		return errors.New("trip not found")
	}

	// Only owner can remove members
	if !s.tripRepo.IsOwner(trip, userID) {
		return errors.New("unauthorized: only owner can remove members")
	}

	// Find member using repository helper
	_, index, err := s.tripRepo.FindMemberByID(trip, memberID)
	if err != nil {
		return err
	}

	// Remove member from slice
	trip.TripMembers = append(trip.TripMembers[:index], trip.TripMembers[index+1:]...)

	return s.tripRepo.Update(ctx, trip)
}
