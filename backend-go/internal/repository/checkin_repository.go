package repository

import (
	"context"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"backend-go/internal/models"
)

type CheckInRepository struct{}

func NewCheckInRepository() *CheckInRepository {
	return &CheckInRepository{}
}

// Create creates a new check-in
func (r *CheckInRepository) Create(ctx context.Context, checkIn *models.CheckIn) error {
	return mgm.Coll(checkIn).CreateWithCtx(ctx, checkIn)
}

// FindByID finds a check-in by ID
func (r *CheckInRepository) FindByID(ctx context.Context, id string) (*models.CheckIn, error) {
	checkIn := &models.CheckIn{}
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	err = mgm.Coll(checkIn).FindByIDWithCtx(ctx, objectID, checkIn)
	if err != nil {
		return nil, err
	}

	return checkIn, nil
}

// FindByUserID finds all check-ins for a user
func (r *CheckInRepository) FindByUserID(ctx context.Context, userID string) ([]*models.CheckIn, error) {
	checkIns := make([]*models.CheckIn, 0)

	opts := options.Find().SetSort(bson.D{{Key: "visited_at", Value: -1}})

	cursor, err := mgm.Coll(&models.CheckIn{}).Find(ctx, bson.M{"user_id": userID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &checkIns); err != nil {
		return nil, err
	}

	return checkIns, nil
}

// FindByUserIDAndCity checks if a user already has a check-in for a specific city
func (r *CheckInRepository) FindByUserIDAndCity(ctx context.Context, userID, cityID string) (*models.CheckIn, error) {
	checkIn := &models.CheckIn{}

	err := mgm.Coll(checkIn).FirstWithCtx(ctx, bson.M{
		"user_id": userID,
		"city_id": cityID,
	}, checkIn)

	if err != nil {
		return nil, err
	}

	return checkIn, nil
}

// Update updates a check-in
func (r *CheckInRepository) Update(ctx context.Context, checkIn *models.CheckIn) error {
	return mgm.Coll(checkIn).UpdateWithCtx(ctx, checkIn)
}

// Delete deletes a check-in
func (r *CheckInRepository) Delete(ctx context.Context, checkIn *models.CheckIn) error {
	return mgm.Coll(checkIn).DeleteWithCtx(ctx, checkIn)
}

// GetStatsByUserID calculates check-in statistics for a user
func (r *CheckInRepository) GetStatsByUserID(ctx context.Context, userID string) (*models.CheckInStats, error) {
	pipeline := []bson.M{
		{"$match": bson.M{"user_id": userID}},
		{"$group": bson.M{
			"_id": bson.M{
				"country_code": "$country_code",
				"country":      "$country",
				"country_flag": "$country_flag",
			},
			"cities_count": bson.M{"$addToSet": "$city_id"},
		}},
		{"$project": bson.M{
			"country_code": "$_id.country_code",
			"country":      "$_id.country",
			"flag":         "$_id.country_flag",
			"cities_count": bson.M{"$size": "$cities_count"},
		}},
		{"$sort": bson.M{"cities_count": -1}},
	}

	cursor, err := mgm.Coll(&models.CheckIn{}).Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		CountryCode string `bson:"country_code"`
		Country     string `bson:"country"`
		Flag        string `bson:"flag"`
		CitiesCount int    `bson:"cities_count"`
	}

	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	stats := &models.CheckInStats{
		Countries: make([]models.CountryStat, len(results)),
	}

	totalCities := 0
	for i, r := range results {
		stats.Countries[i] = models.CountryStat{
			CountryCode: r.CountryCode,
			Country:     r.Country,
			Flag:        r.Flag,
			CitiesCount: r.CitiesCount,
		}
		totalCities += r.CitiesCount
	}

	stats.TotalCountries = len(results)
	stats.TotalCities = totalCities

	return stats, nil
}

// CountByUserID counts total check-ins for a user
func (r *CheckInRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	return mgm.Coll(&models.CheckIn{}).CountDocuments(ctx, bson.M{"user_id": userID})
}
