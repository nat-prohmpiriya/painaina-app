package repository

import (
	"context"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"backend-go/internal/models"
	"backend-go/pkg/utils"
)

type PlaceRepository struct{
	tracer trace.Tracer
}

func NewPlaceRepository() *PlaceRepository {
	return &PlaceRepository{
		tracer: otel.Tracer("place-repository"),
	}
}

// Create creates a new place
func (r *PlaceRepository) Create(ctx context.Context, place *models.Place) error {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"googlePlaceID": place.GooglePlaceID,
		"name":          place.Name,
	})

	// Set timestamps manually
	now := time.Now()
	place.CreatedAt = now
	place.UpdatedAt = now

	err := mgm.Coll(place).CreateWithCtx(ctx, place)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"placeID": place.ID.Hex(),
	})
	return nil
}

// FindByID finds a place by ID
func (r *PlaceRepository) FindByID(ctx context.Context, id string) (*models.Place, error) {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"placeID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	place := &models.Place{}
	err = mgm.Coll(place).FindByIDWithCtx(ctx, objectID, place)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"name":          place.Name,
		"googlePlaceID": place.GooglePlaceID,
	})
	return place, nil
}

// FindByGooglePlaceID finds a place by Google Place ID
func (r *PlaceRepository) FindByGooglePlaceID(ctx context.Context, googlePlaceID string) (*models.Place, error) {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.FindByGooglePlaceID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"googlePlaceID": googlePlaceID,
	})

	place := &models.Place{}
	err := mgm.Coll(place).FirstWithCtx(ctx, bson.M{"google_place_id": googlePlaceID}, place)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"placeID": place.ID.Hex(),
		"name":    place.Name,
	})
	return place, nil
}

// Update updates a place
func (r *PlaceRepository) Update(ctx context.Context, place *models.Place) error {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"placeID": place.ID.Hex(),
	})

	err := mgm.Coll(place).UpdateWithCtx(ctx, place)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Place updated successfully")
	return nil
}

// Upsert finds or creates a place by Google Place ID
func (r *PlaceRepository) Upsert(ctx context.Context, place *models.Place) error {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.Upsert")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"googlePlaceID": place.GooglePlaceID,
		"name":          place.Name,
	})

	existingPlace, err := r.FindByGooglePlaceID(ctx, place.GooglePlaceID)
	if err == nil {
		// Place exists, update it
		place.ID = existingPlace.ID
		place.CreatedAt = existingPlace.CreatedAt
		place.UpdatedAt = time.Now()
		err = r.Update(ctx, place)
		if err != nil {
			logger.Error(err)
			return err
		}
		logger.Info("Place updated via upsert")
		return nil
	}

	// Place doesn't exist, create it
	err = r.Create(ctx, place)
	if err != nil {
		logger.Error(err)
		return err
	}
	logger.Info("Place created via upsert")
	return nil
}

// Delete deletes a place
func (r *PlaceRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"placeID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.Place{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Place deleted successfully")
	return nil
}

// FindExpired finds places with expired cache
func (r *PlaceRepository) FindExpired(ctx context.Context, limit int64) ([]*models.Place, error) {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.FindExpired")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"limit": limit,
	})

	places := []*models.Place{}
	opts := options.Find().SetLimit(limit)
	cursor, err := mgm.Coll(&models.Place{}).Find(ctx, bson.M{
		"cache_expires_at": bson.M{"$lt": time.Now()},
	}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &places)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(places),
	})
	return places, nil
}

// SearchByName searches places by name
func (r *PlaceRepository) SearchByName(ctx context.Context, query string, skip, limit int64) ([]*models.Place, error) {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.SearchByName")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"query": query,
		"skip":  skip,
		"limit": limit,
	})

	places := []*models.Place{}
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := mgm.Coll(&models.Place{}).Find(ctx, bson.M{
		"name": bson.M{"$regex": query, "$options": "i"},
	}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &places)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(places),
	})
	return places, nil
}

// List lists all places with pagination
func (r *PlaceRepository) List(ctx context.Context, skip, limit int64) ([]*models.Place, error) {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.List")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"skip":  skip,
		"limit": limit,
	})

	places := []*models.Place{}
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := mgm.Coll(&models.Place{}).Find(ctx, bson.M{}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &places)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(places),
	})
	return places, nil
}

// Count counts total places
func (r *PlaceRepository) Count(ctx context.Context) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.Count")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	count, err := mgm.Coll(&models.Place{}).CountDocuments(ctx, bson.M{})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}

// DeleteOlderThan deletes places older than the specified duration (for TOS compliance)
func (r *PlaceRepository) DeleteOlderThan(ctx context.Context, duration time.Duration) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "PlaceRepository.DeleteOlderThan")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	cutoffTime := time.Now().Add(-duration)
	logger.Input(map[string]interface{}{
		"cutoffTime": cutoffTime,
		"duration":   duration.String(),
	})

	result, err := mgm.Coll(&models.Place{}).DeleteMany(ctx, bson.M{
		"updated_at": bson.M{"$lt": cutoffTime},
	})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"deletedCount": result.DeletedCount,
	})
	return result.DeletedCount, nil
}
