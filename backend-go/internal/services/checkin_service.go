package services

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/internal/schemas"
)

type CheckInService struct {
	repo *repository.CheckInRepository
}

func NewCheckInService(repo *repository.CheckInRepository) *CheckInService {
	return &CheckInService{repo: repo}
}

// CreateCheckIn creates a new check-in for a user
func (s *CheckInService) CreateCheckIn(ctx context.Context, userID string, req *schemas.CreateCheckInRequest) (*models.CheckIn, error) {
	// Check if user already has a check-in for this city
	existing, err := s.repo.FindByUserIDAndCity(ctx, userID, req.CityID)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("you have already checked in to this city")
	}

	// Parse visited date
	visitedAt, err := time.Parse("2006-01-02", req.VisitedAt)
	if err != nil {
		// Try ISO format
		visitedAt, err = time.Parse(time.RFC3339, req.VisitedAt)
		if err != nil {
			return nil, errors.New("invalid date format, use YYYY-MM-DD")
		}
	}

	checkIn := &models.CheckIn{
		UserID:      userID,
		CountryCode: req.CountryCode,
		Country:     req.Country,
		CountryFlag: req.CountryFlag,
		RegionID:    req.RegionID,
		Region:      req.Region,
		CityID:      req.CityID,
		City:        req.City,
		Location: models.GeoPoint{
			Type:        "Point",
			Coordinates: []float64{req.Longitude, req.Latitude},
			Latitude:    req.Latitude,
			Longitude:   req.Longitude,
		},
		VisitedAt: visitedAt,
		Note:      req.Note,
		TripID:    req.TripID,
	}

	if err := s.repo.Create(ctx, checkIn); err != nil {
		return nil, err
	}

	return checkIn, nil
}

// GetCheckIn gets a check-in by ID
func (s *CheckInService) GetCheckIn(ctx context.Context, id string) (*models.CheckIn, error) {
	return s.repo.FindByID(ctx, id)
}

// GetUserCheckIns gets all check-ins for a user
func (s *CheckInService) GetUserCheckIns(ctx context.Context, userID string) ([]*models.CheckIn, error) {
	return s.repo.FindByUserID(ctx, userID)
}

// GetUserCheckInsWithStats gets all check-ins and stats for a user
func (s *CheckInService) GetUserCheckInsWithStats(ctx context.Context, userID string) ([]*models.CheckIn, *models.CheckInStats, error) {
	checkIns, err := s.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	stats, err := s.repo.GetStatsByUserID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	return checkIns, stats, nil
}

// UpdateCheckIn updates a check-in
func (s *CheckInService) UpdateCheckIn(ctx context.Context, id, userID string, req *schemas.UpdateCheckInRequest) (*models.CheckIn, error) {
	checkIn, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Verify ownership
	if checkIn.UserID != userID {
		return nil, errors.New("unauthorized: you can only update your own check-ins")
	}

	// Update fields
	if req.VisitedAt != nil {
		visitedAt, err := time.Parse("2006-01-02", *req.VisitedAt)
		if err != nil {
			visitedAt, err = time.Parse(time.RFC3339, *req.VisitedAt)
			if err != nil {
				return nil, errors.New("invalid date format")
			}
		}
		checkIn.VisitedAt = visitedAt
	}

	if req.Note != nil {
		checkIn.Note = req.Note
	}

	if req.Photos != nil {
		checkIn.Photos = req.Photos
	}

	if req.TripID != nil {
		checkIn.TripID = req.TripID
	}

	if err := s.repo.Update(ctx, checkIn); err != nil {
		return nil, err
	}

	return checkIn, nil
}

// DeleteCheckIn deletes a check-in
func (s *CheckInService) DeleteCheckIn(ctx context.Context, id, userID string) error {
	checkIn, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	// Verify ownership
	if checkIn.UserID != userID {
		return errors.New("unauthorized: you can only delete your own check-ins")
	}

	return s.repo.Delete(ctx, checkIn)
}

// GetUserStats gets check-in statistics for a user
func (s *CheckInService) GetUserStats(ctx context.Context, userID string) (*models.CheckInStats, error) {
	return s.repo.GetStatsByUserID(ctx, userID)
}
