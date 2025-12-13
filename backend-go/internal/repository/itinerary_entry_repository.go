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

type ItineraryEntryRepository struct{
	tracer trace.Tracer
}

func NewItineraryEntryRepository() *ItineraryEntryRepository {
	return &ItineraryEntryRepository{
		tracer: otel.Tracer("itinerary-entry-repository"),
	}
}

// Helper methods to encapsulate ObjectID logic

// NewEntry creates a new ItineraryEntry with ItineraryID from string
func (r *ItineraryEntryRepository) NewEntry(itineraryID string) (*models.ItineraryEntry, error) {
	itineraryObjID, err := primitive.ObjectIDFromHex(itineraryID)
	if err != nil {
		return nil, err
	}

	return &models.ItineraryEntry{
		ItineraryID: itineraryObjID,
	}, nil
}

// SetPlaceID sets PlaceID from string (optional)
func (r *ItineraryEntryRepository) SetPlaceID(entry *models.ItineraryEntry, placeID string) error {
	if placeID == "" {
		return nil
	}

	placeObjID, err := primitive.ObjectIDFromHex(placeID)
	if err != nil {
		return err
	}

	entry.PlaceID = &placeObjID
	return nil
}

// Create creates a new itinerary entry
func (r *ItineraryEntryRepository) Create(ctx context.Context, entry *models.ItineraryEntry) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": entry.ItineraryID.Hex(),
		"type":        entry.Type,
		"order":       entry.Order,
	})

	// Set timestamps manually
	now := time.Now()
	entry.CreatedAt = now
	entry.UpdatedAt = now

	err := mgm.Coll(entry).CreateWithCtx(ctx, entry)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"entryID": entry.ID.Hex(),
	})
	return nil
}

// FindByID finds an entry by ID
func (r *ItineraryEntryRepository) FindByID(ctx context.Context, id string) (*models.ItineraryEntry, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	entry := &models.ItineraryEntry{}
	err = mgm.Coll(entry).FindByIDWithCtx(ctx, objectID, entry)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"type":  entry.Type,
		"order": entry.Order,
	})
	return entry, nil
}

// FindByItineraryID finds all entries for an itinerary (day), sorted by order
func (r *ItineraryEntryRepository) FindByItineraryID(ctx context.Context, itineraryID string) ([]*models.ItineraryEntry, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.FindByItineraryID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": itineraryID,
	})

	objectID, err := primitive.ObjectIDFromHex(itineraryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	entries := []*models.ItineraryEntry{}
	opts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})

	cursor, err := mgm.Coll(&models.ItineraryEntry{}).Find(ctx, bson.M{"itinerary_id": objectID}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &entries)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(entries),
	})
	return entries, nil
}

// FindByItineraryIDWithPlaces finds all entries for an itinerary with place data aggregated, sorted by order
func (r *ItineraryEntryRepository) FindByItineraryIDWithPlaces(ctx context.Context, itineraryID string) ([]*models.ItineraryEntry, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.FindByItineraryIDWithPlaces")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": itineraryID,
	})

	objectID, err := primitive.ObjectIDFromHex(itineraryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	pipeline := bson.A{
		// Match entries for this itinerary
		bson.M{"$match": bson.M{
			"itinerary_id": objectID,
		}},

		// Lookup place data for each entry
		bson.M{"$lookup": bson.M{
			"from":         "places",
			"localField":   "place_id",
			"foreignField": "_id",
			"as":           "place_lookup",
		}},

		// Add place field (take first element from lookup result)
		bson.M{"$addFields": bson.M{
			"place": bson.M{
				"$arrayElemAt": bson.A{"$place_lookup", 0},
			},
		}},

		// Remove temporary place_lookup field
		bson.M{"$project": bson.M{
			"place_lookup": 0,
		}},

		// Sort by order
		bson.M{"$sort": bson.M{"order": 1}},
	}

	cursor, err := mgm.Coll(&models.ItineraryEntry{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	entries := []*models.ItineraryEntry{}
	err = cursor.All(ctx, &entries)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(entries),
	})
	return entries, nil
}

// FindByType finds entries by type (activity, place, note)
func (r *ItineraryEntryRepository) FindByType(ctx context.Context, itineraryID string, entryType models.EntryType) ([]*models.ItineraryEntry, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.FindByType")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": itineraryID,
		"entryType":   entryType,
	})

	objectID, err := primitive.ObjectIDFromHex(itineraryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	entries := []*models.ItineraryEntry{}
	opts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})

	cursor, err := mgm.Coll(&models.ItineraryEntry{}).Find(ctx, bson.M{
		"itinerary_id": objectID,
		"type":         entryType,
	}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &entries)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(entries),
	})
	return entries, nil
}

// Update updates an entry
func (r *ItineraryEntryRepository) Update(ctx context.Context, entry *models.ItineraryEntry) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID": entry.ID.Hex(),
	})

	err := mgm.Coll(entry).UpdateWithCtx(ctx, entry)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Entry updated successfully")
	return nil
}

// Delete deletes an entry
func (r *ItineraryEntryRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.ItineraryEntry{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Entry deleted successfully")
	return nil
}

// DeleteByItineraryID deletes all entries for an itinerary
func (r *ItineraryEntryRepository) DeleteByItineraryID(ctx context.Context, itineraryID string) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.DeleteByItineraryID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": itineraryID,
	})

	objectID, err := primitive.ObjectIDFromHex(itineraryID)
	if err != nil {
		logger.Error(err)
		return err
	}

	result, err := mgm.Coll(&models.ItineraryEntry{}).DeleteMany(ctx, bson.M{"itinerary_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"deletedCount": result.DeletedCount,
	})
	return nil
}

// Count counts total entries for an itinerary
func (r *ItineraryEntryRepository) CountByItineraryID(ctx context.Context, itineraryID string) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryEntryRepository.CountByItineraryID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": itineraryID,
	})

	objectID, err := primitive.ObjectIDFromHex(itineraryID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	count, err := mgm.Coll(&models.ItineraryEntry{}).CountDocuments(ctx, bson.M{"itinerary_id": objectID})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}
