package repository

import (
	"context"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"backend-go/internal/models"
	"backend-go/pkg/utils"
)

type PackingRepository struct {
	tracer trace.Tracer
}

func NewPackingRepository() *PackingRepository {
	return &PackingRepository{
		tracer: otel.Tracer("packing-repository"),
	}
}

// FindByTripID finds the packing list for a trip
func (r *PackingRepository) FindByTripID(ctx context.Context, tripID string) (*models.PackingList, error) {
	ctx, span := r.tracer.Start(ctx, "PackingRepository.FindByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	packingList := &models.PackingList{}
	err = mgm.Coll(packingList).First(bson.M{"trip_id": objectID}, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"packingListID": packingList.ID.Hex(),
		"itemCount":     len(packingList.Items),
	})
	return packingList, nil
}

// FindOrCreateByTripID finds or creates the packing list for a trip
func (r *PackingRepository) FindOrCreateByTripID(ctx context.Context, tripID string) (*models.PackingList, error) {
	ctx, span := r.tracer.Start(ctx, "PackingRepository.FindOrCreateByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	// Try to find existing
	packingList, err := r.FindByTripID(ctx, tripID)
	if err == nil {
		return packingList, nil
	}

	// Create new if not found
	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	packingList = &models.PackingList{
		TripID: objectID,
		Items:  []models.PackingItem{},
	}

	now := time.Now()
	packingList.CreatedAt = now
	packingList.UpdatedAt = now

	err = mgm.Coll(packingList).CreateWithCtx(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"packingListID": packingList.ID.Hex(),
		"created":       true,
	})
	return packingList, nil
}

// Update updates the packing list
func (r *PackingRepository) Update(ctx context.Context, packingList *models.PackingList) error {
	ctx, span := r.tracer.Start(ctx, "PackingRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"packingListID": packingList.ID.Hex(),
		"itemCount":     len(packingList.Items),
	})

	packingList.UpdatedAt = time.Now()

	err := mgm.Coll(packingList).UpdateWithCtx(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Packing list updated successfully")
	return nil
}

// Delete deletes the packing list
func (r *PackingRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "PackingRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"packingListID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.PackingList{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Packing list deleted successfully")
	return nil
}

// DeleteByTripID deletes the packing list for a trip
func (r *PackingRepository) DeleteByTripID(ctx context.Context, tripID string) error {
	ctx, span := r.tracer.Start(ctx, "PackingRepository.DeleteByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return err
	}

	result, err := mgm.Coll(&models.PackingList{}).DeleteMany(ctx, bson.M{"trip_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"deletedCount": result.DeletedCount,
	})
	return nil
}
