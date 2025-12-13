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

type ItineraryRepository struct{
	tracer trace.Tracer
}

func NewItineraryRepository() *ItineraryRepository {
	return &ItineraryRepository{
		tracer: otel.Tracer("itinerary-repository"),
	}
}

// Helper methods to encapsulate ObjectID logic

// NewItinerary creates a new Itinerary with TripID from string
func (r *ItineraryRepository) NewItinerary(tripID string) (*models.Itinerary, error) {
	tripObjID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		return nil, err
	}

	return &models.Itinerary{
		TripID: tripObjID,
	}, nil
}

// Create creates a new itinerary (day)
func (r *ItineraryRepository) Create(ctx context.Context, itinerary *models.Itinerary) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": itinerary.TripID.Hex(),
		"order":  itinerary.Order,
	})

	// Set timestamps manually
	now := time.Now()
	itinerary.CreatedAt = now
	itinerary.UpdatedAt = now

	err := mgm.Coll(itinerary).CreateWithCtx(ctx, itinerary)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"itineraryID": itinerary.ID.Hex(),
	})
	return nil
}

// FindByID finds an itinerary by ID
func (r *ItineraryRepository) FindByID(ctx context.Context, id string) (*models.Itinerary, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	itinerary := &models.Itinerary{}
	err = mgm.Coll(itinerary).FindByIDWithCtx(ctx, objectID, itinerary)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"tripID": itinerary.TripID.Hex(),
		"order":  itinerary.Order,
	})
	return itinerary, nil
}

// FindByTripID finds all itineraries (days) for a trip, sorted by order
func (r *ItineraryRepository) FindByTripID(ctx context.Context, tripID string) ([]*models.Itinerary, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.FindByTripID")
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

	itineraries := []*models.Itinerary{}
	opts := options.Find().SetSort(bson.D{{Key: "order", Value: 1}})

	cursor, err := mgm.Coll(&models.Itinerary{}).Find(ctx, bson.M{"trip_id": objectID}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &itineraries)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(itineraries),
	})
	return itineraries, nil
}

// Update updates an itinerary
func (r *ItineraryRepository) Update(ctx context.Context, itinerary *models.Itinerary) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": itinerary.ID.Hex(),
	})

	err := mgm.Coll(itinerary).UpdateWithCtx(ctx, itinerary)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Itinerary updated successfully")
	return nil
}

// Delete deletes an itinerary
func (r *ItineraryRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.Itinerary{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Itinerary deleted successfully")
	return nil
}

// DeleteByTripID deletes all itineraries for a trip
func (r *ItineraryRepository) DeleteByTripID(ctx context.Context, tripID string) error {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.DeleteByTripID")
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

	result, err := mgm.Coll(&models.Itinerary{}).DeleteMany(ctx, bson.M{"trip_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"deletedCount": result.DeletedCount,
	})
	return nil
}

// Count counts total itineraries for a trip
func (r *ItineraryRepository) CountByTripID(ctx context.Context, tripID string) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.CountByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	count, err := mgm.Coll(&models.Itinerary{}).CountDocuments(ctx, bson.M{"trip_id": objectID})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}

// FindByTripIDWithEntries finds all itineraries with their entries using aggregation (1 query)
func (r *ItineraryRepository) FindByTripIDWithEntries(ctx context.Context, tripID string) ([]*models.Itinerary, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.FindByTripIDWithEntries")
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

	pipeline := bson.A{
		// Match itineraries for this trip
		bson.M{"$match": bson.M{"trip_id": objectID}},
		// Lookup entries from itinerary_entries collection
		bson.M{"$lookup": bson.M{
			"from":         "itinerary_entries",
			"localField":   "_id",
			"foreignField": "itinerary_id",
			"as":           "entries",
		}},
		// Lookup place data for each entry
		bson.M{"$lookup": bson.M{
			"from":         "places",
			"localField":   "entries.place_id",
			"foreignField": "_id",
			"as":           "places_data",
		}},
		// Map place data back to entries
		bson.M{"$addFields": bson.M{
			"entries": bson.M{
				"$map": bson.M{
					"input": "$entries",
					"as":    "entry",
					"in": bson.M{
						"$mergeObjects": bson.A{
							"$$entry",
							bson.M{
								"place": bson.M{
									"$arrayElemAt": bson.A{
										bson.M{
											"$filter": bson.M{
												"input": "$places_data",
												"as":    "place",
												"cond": bson.M{
													"$eq": bson.A{"$$place._id", "$$entry.place_id"},
												},
											},
										},
										0,
									},
								},
							},
						},
					},
				},
			},
		}},
		// Remove temporary places_data field
		bson.M{"$project": bson.M{
			"places_data": 0,
		}},
		// Sort entries by order within each itinerary
		bson.M{"$addFields": bson.M{
			"entries": bson.M{
				"$sortArray": bson.M{
					"input":  "$entries",
					"sortBy": bson.M{"order": 1},
				},
			},
		}},
		// Sort itineraries by order
		bson.M{"$sort": bson.M{"order": 1}},
	}

	cursor, err := mgm.Coll(&models.Itinerary{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	itineraries := []*models.Itinerary{}
	if err = cursor.All(ctx, &itineraries); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(itineraries),
	})
	return itineraries, nil
}

// FindByIDWithEntries finds a single itinerary with its entries using aggregation
func (r *ItineraryRepository) FindByIDWithEntries(ctx context.Context, id string) (*models.Itinerary, error) {
	ctx, span := r.tracer.Start(ctx, "ItineraryRepository.FindByIDWithEntries")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	pipeline := bson.A{
		// Match this specific itinerary
		bson.M{"$match": bson.M{"_id": objectID}},
		// Lookup entries
		bson.M{"$lookup": bson.M{
			"from":         "itinerary_entries",
			"localField":   "_id",
			"foreignField": "itinerary_id",
			"as":           "entries",
		}},
		// Lookup place data for each entry
		bson.M{"$lookup": bson.M{
			"from":         "places",
			"localField":   "entries.place_id",
			"foreignField": "_id",
			"as":           "places_data",
		}},
		// Map place data back to entries
		bson.M{"$addFields": bson.M{
			"entries": bson.M{
				"$map": bson.M{
					"input": "$entries",
					"as":    "entry",
					"in": bson.M{
						"$mergeObjects": bson.A{
							"$$entry",
							bson.M{
								"place": bson.M{
									"$arrayElemAt": bson.A{
										bson.M{
											"$filter": bson.M{
												"input": "$places_data",
												"as":    "place",
												"cond": bson.M{
													"$eq": bson.A{"$$place._id", "$$entry.place_id"},
												},
											},
										},
										0,
									},
								},
							},
						},
					},
				},
			},
		}},
		// Remove temporary places_data field
		bson.M{"$project": bson.M{
			"places_data": 0,
		}},
		// Sort entries by order
		bson.M{"$addFields": bson.M{
			"entries": bson.M{
				"$sortArray": bson.M{
					"input":  "$entries",
					"sortBy": bson.M{"order": 1},
				},
			},
		}},
	}

	cursor, err := mgm.Coll(&models.Itinerary{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	itineraries := []*models.Itinerary{}
	if err = cursor.All(ctx, &itineraries); err != nil {
		logger.Error(err)
		return nil, err
	}

	if len(itineraries) == 0 {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"tripID": itineraries[0].TripID.Hex(),
	})
	return itineraries[0], nil
}
