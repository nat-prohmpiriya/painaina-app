package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"backend-go/internal/models"
	"backend-go/internal/schemas"
	"backend-go/pkg/utils"
)

type TripRepository struct{
	tracer trace.Tracer
}

// TripFilter represents dynamic filter options for querying trips
type TripFilter struct {
	Type     *string
	Status   *string
	OwnerID  *string
	MemberID *string
	Tags     []string
	Limit    int64
	Offset   int64
}

func NewTripRepository() *TripRepository {
	return &TripRepository{
		tracer: otel.Tracer("trip-repository"),
	}
}

// Create creates a new trip
func (r *TripRepository) Create(ctx context.Context, trip *models.Trip) error {
	ctx, span := r.tracer.Start(ctx, "TripRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"ownerID": trip.OwnerID.Hex(),
		"title":   trip.Title,
	})

	// Set timestamps manually before creating
	now := time.Now()
	trip.CreatedAt = now
	trip.UpdatedAt = now

	err := mgm.Coll(trip).CreateWithCtx(ctx, trip)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"tripID": trip.ID.Hex(),
	})
	return nil
}

// NewTrip creates a new Trip model from string IDs (helper for service layer)
func (r *TripRepository) NewTrip(ownerID string) (*models.Trip, error) {
	objID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		return nil, err
	}

	return &models.Trip{
		OwnerID: objID,
	}, nil
}

// IsOwner checks if userID owns the trip (helper to avoid ObjectID in service)
func (r *TripRepository) IsOwner(trip *models.Trip, userID string) bool {
	return trip.OwnerID.Hex() == userID
}

// NewTripMember creates a TripMember from string userID (helper for service layer)
func (r *TripRepository) NewTripMember(userID, role string) (*models.TripMember, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	return &models.TripMember{
		ID:       primitive.NewObjectID(),
		UserID:   objID,
		Role:     role,
		JoinedAt: time.Now(),
	}, nil
}

// FindMemberByID finds a trip member by string ID
func (r *TripRepository) FindMemberByID(trip *models.Trip, memberID string) (*models.TripMember, int, error) {
	objID, err := primitive.ObjectIDFromHex(memberID)
	if err != nil {
		return nil, -1, err
	}

	for i, member := range trip.TripMembers {
		if member.ID == objID {
			return &member, i, nil
		}
	}

	return nil, -1, errors.New("member not found")
}

// IsMemberExists checks if userID is already a member
func (r *TripRepository) IsMemberExists(trip *models.Trip, userID string) bool {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false
	}

	for _, member := range trip.TripMembers {
		if member.UserID == objID {
			return true
		}
	}

	return false
}

// FindByID finds a trip by ID (excluding soft deleted)
func (r *TripRepository) FindByID(ctx context.Context, id string) (*models.Trip, error) {
	ctx, span := r.tracer.Start(ctx, "TripRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	trip := &models.Trip{}
	err = mgm.Coll(trip).FirstWithCtx(ctx, bson.M{
		"_id":        objectID,
		"deleted_at": nil,
	}, trip)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"title":   trip.Title,
		"ownerID": trip.OwnerID.Hex(),
	})
	return trip, nil
}

// Find finds trips using dynamic filters
func (r *TripRepository) Find(ctx context.Context, filter *TripFilter) ([]*models.Trip, error) {
	ctx, span := r.tracer.Start(ctx, "TripRepository.Find")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"type":     filter.Type,
		"status":   filter.Status,
		"ownerId":  filter.OwnerID,
		"memberId": filter.MemberID,
		"tags":     filter.Tags,
		"limit":    filter.Limit,
		"offset":   filter.Offset,
	})

	// Build MongoDB filter dynamically
	mongoFilter := bson.M{
		"deleted_at": nil, // Exclude soft deleted
	}

	if filter.Type != nil {
		mongoFilter["type"] = *filter.Type
	}

	if filter.Status != nil {
		mongoFilter["status"] = *filter.Status
	}

	if filter.OwnerID != nil {
		ownerObjID, err := primitive.ObjectIDFromHex(*filter.OwnerID)
		if err != nil {
			logger.Error(err)
			return nil, fmt.Errorf("invalid owner ID: %w", err)
		}
		mongoFilter["owner_id"] = ownerObjID
	}

	if filter.MemberID != nil {
		memberObjID, err := primitive.ObjectIDFromHex(*filter.MemberID)
		if err != nil {
			logger.Error(err)
			return nil, fmt.Errorf("invalid member ID: %w", err)
		}
		mongoFilter["trip_members.user_id"] = memberObjID
	}

	if len(filter.Tags) > 0 {
		mongoFilter["tags"] = bson.M{"$in": filter.Tags}
	}

	// Set default limit if not provided
	limit := filter.Limit
	if limit == 0 {
		limit = 20
	}

	// Build aggregation pipeline with owner lookup
	pipeline := bson.A{
		// Match stage
		bson.M{"$match": mongoFilter},

		// Lookup owner user data
		bson.M{"$lookup": bson.M{
			"from":         "users",
			"localField":   "owner_id",
			"foreignField": "_id",
			"as":           "owner",
			"pipeline": bson.A{
				bson.M{"$project": bson.M{
					"_id":       1,
					"name":      1,
					"photo_url": 1,
				}},
			},
		}},
		bson.M{"$unwind": bson.M{
			"path":                       "$owner",
			"preserveNullAndEmptyArrays": true,
		}},

		// Lookup members user data
		bson.M{"$lookup": bson.M{
			"from": "users",
			"let":  bson.M{"member_ids": "$trip_members.user_id"},
			"pipeline": bson.A{
				bson.M{"$match": bson.M{
					"$expr": bson.M{"$in": bson.A{"$_id", "$$member_ids"}},
				}},
				bson.M{"$project": bson.M{
					"_id":       1,
					"name":      1,
					"photo_url": 1,
				}},
			},
			"as": "member_users",
		}},

		// Add user data to each member
		bson.M{"$addFields": bson.M{
			"trip_members": bson.M{
				"$map": bson.M{
					"input": "$trip_members",
					"as":    "member",
					"in": bson.M{
						"$mergeObjects": bson.A{
							"$$member",
							bson.M{
								"user": bson.M{
									"$arrayElemAt": bson.A{
										bson.M{
											"$filter": bson.M{
												"input": "$member_users",
												"as":    "u",
												"cond":  bson.M{"$eq": bson.A{"$$u._id", "$$member.user_id"}},
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

		// Remove temporary member_users field
		bson.M{"$project": bson.M{
			"member_users": 0,
		}},

		// Sort by created_at descending
		bson.M{"$sort": bson.M{"created_at": -1}},

		// Pagination
		bson.M{"$skip": filter.Offset},
		bson.M{"$limit": limit},
	}

	// Execute aggregation
	trips := []*models.Trip{}
	cursor, err := mgm.Coll(&models.Trip{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &trips); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(trips),
	})
	return trips, nil
}

// Update updates a trip
func (r *TripRepository) Update(ctx context.Context, trip *models.Trip) error {
	ctx, span := r.tracer.Start(ctx, "TripRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": trip.ID.Hex(),
		"title":  trip.Title,
	})

	err := mgm.Coll(trip).UpdateWithCtx(ctx, trip)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Trip updated successfully")
	return nil
}

// SoftDelete soft deletes a trip
func (r *TripRepository) SoftDelete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "TripRepository.SoftDelete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	trip := &models.Trip{}
	err = mgm.Coll(trip).FindByIDWithCtx(ctx, objectID, trip)
	if err != nil {
		logger.Error(err)
		return err
	}

	trip.SoftDelete()
	err = mgm.Coll(trip).UpdateWithCtx(ctx, trip)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Trip soft deleted successfully")
	return nil
}

// Delete hard deletes a trip
func (r *TripRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "TripRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.Trip{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Trip deleted successfully")
	return nil
}

// SearchByTitle searches trips by title
func (r *TripRepository) SearchByTitle(ctx context.Context, query string, skip, limit int64) ([]*models.Trip, error) {
	ctx, span := r.tracer.Start(ctx, "TripRepository.SearchByTitle")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"query": query,
		"skip":  skip,
		"limit": limit,
	})

	trips := []*models.Trip{}
	filter := bson.M{
		"title":      bson.M{"$regex": query, "$options": "i"},
		"deleted_at": nil,
		"status":     models.TripStatusPublished,
	}

	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := mgm.Coll(&models.Trip{}).Find(ctx, filter, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &trips)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(trips),
	})
	return trips, nil
}

// Count counts total trips
func (r *TripRepository) Count(ctx context.Context) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "TripRepository.Count")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	count, err := mgm.Coll(&models.Trip{}).CountDocuments(ctx, bson.M{
		"deleted_at": nil,
	})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}

// FindByIDWithFullData gets trip with itineraries, entries, expenses, owner, and members in 1 query
func (r *TripRepository) FindByIDWithFullData(ctx context.Context, id string) (*schemas.TripDetailResponse, error) {
	ctx, span := r.tracer.Start(ctx, "TripRepository.FindByIDWithFullData")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	pipeline := bson.A{
		// Match trip (exclude soft deleted)
		bson.M{"$match": bson.M{
			"_id":        objectID,
			"deleted_at": nil,
		}},

		// Lookup owner user data
		bson.M{"$lookup": bson.M{
			"from":         "users",
			"localField":   "owner_id",
			"foreignField": "_id",
			"as":           "owner",
			"pipeline": bson.A{
				bson.M{"$project": bson.M{
					"_id":       1,
					"name":      1,
					"photo_url": 1,
				}},
			},
		}},
		bson.M{"$unwind": bson.M{
			"path":                       "$owner",
			"preserveNullAndEmptyArrays": true,
		}},

		// Lookup members user data
		bson.M{"$lookup": bson.M{
			"from": "users",
			"let":  bson.M{"member_ids": "$trip_members.user_id"},
			"pipeline": bson.A{
				bson.M{"$match": bson.M{
					"$expr": bson.M{"$in": bson.A{"$_id", "$$member_ids"}},
				}},
				bson.M{"$project": bson.M{
					"_id":       1,
					"name":      1,
					"photo_url": 1,
				}},
			},
			"as": "member_users",
		}},

		// Add user data to each member
		bson.M{"$addFields": bson.M{
			"trip_members": bson.M{
				"$map": bson.M{
					"input": "$trip_members",
					"as":    "member",
					"in": bson.M{
						"$mergeObjects": bson.A{
							"$$member",
							bson.M{
								"user": bson.M{
									"$arrayElemAt": bson.A{
										bson.M{
											"$filter": bson.M{
												"input": "$member_users",
												"as":    "u",
												"cond":  bson.M{"$eq": bson.A{"$$u._id", "$$member.user_id"}},
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

		// Remove temporary field
		bson.M{"$project": bson.M{
			"member_users": 0,
		}},

		// Lookup itineraries with entries and places
		bson.M{"$lookup": bson.M{
			"from":         "itineraries",
			"localField":   "_id",
			"foreignField": "trip_id",
			"as":           "itineraries",
			"pipeline": bson.A{
				// Lookup entries for each itinerary
				bson.M{"$lookup": bson.M{
					"from":         "itinerary_entries",
					"localField":   "_id",
					"foreignField": "itinerary_id",
					"as":           "entries",
					"pipeline": bson.A{
						// Lookup place for each entry
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
					},
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
				// Sort itineraries by order
				bson.M{"$sort": bson.M{"order": 1}},
			},
		}},

		// Lookup expenses
		bson.M{"$lookup": bson.M{
			"from":         "expenses",
			"localField":   "_id",
			"foreignField": "trip_id",
			"as":           "expenses",
		}},

		// Final projection to convert ObjectIDs to strings and ensure schema compatibility
		bson.M{"$project": bson.M{
			// Convert trip _id to string
			"_id": bson.M{"$toString": "$_id"},
			// Convert owner_id to string
			"owner_id": bson.M{"$toString": "$owner_id"},
			// Keep all other trip fields
			"title":            1,
			"description":      1,
			"start_date":       1,
			"end_date":         1,
			"destinations":     1,
			"budget_total":     1,
			"budget_currency":  1,
			"cover_photo":      1,
			"tags":             1,
			"status":           1,
			"type":             1,
			"level":            1,
			"view_count":       1,
			"reactions_count":  1,
			"bookmark_count":   1,
			"share_count":      1,
			"created_at":       1,
			"updated_at":       1,
			// Convert owner._id to string
			"owner": bson.M{
				"_id":       bson.M{"$toString": "$owner._id"},
				"name":      "$owner.name",
				"photo_url": "$owner.photo_url",
			},
			// Convert trip_members IDs to strings
			"trip_members": bson.M{
				"$map": bson.M{
					"input": "$trip_members",
					"as":    "member",
					"in": bson.M{
						"_id":       bson.M{"$toString": "$$member._id"},
						"user_id":   bson.M{"$toString": "$$member.user_id"},
						"role":      "$$member.role",
						"joined_at": "$$member.joined_at",
						"user": bson.M{
							"$cond": bson.A{
								bson.M{"$ne": bson.A{"$$member.user", nil}},
								bson.M{
									"_id":       bson.M{"$toString": "$$member.user._id"},
									"name":      "$$member.user.name",
									"photo_url": "$$member.user.photo_url",
								},
								nil,
							},
						},
					},
				},
			},
			// Convert itineraries IDs to strings
			"itineraries": bson.M{
				"$map": bson.M{
					"input": "$itineraries",
					"as":    "itin",
					"in": bson.M{
						"_id":        bson.M{"$toString": "$$itin._id"},
						"trip_id":    bson.M{"$toString": "$$itin.trip_id"},
						"day_number": "$$itin.day_number",
						"date":       "$$itin.date",
						"title":      "$$itin.title",
						"order":      "$$itin.order",
						"created_at": "$$itin.created_at",
						"updated_at": "$$itin.updated_at",
						// Convert entries IDs to strings
						"entries": bson.M{
							"$map": bson.M{
								"input": "$$itin.entries",
								"as":    "entry",
								"in": bson.M{
									"_id":          bson.M{"$toString": "$$entry._id"},
									"itinerary_id": bson.M{"$toString": "$$entry.itinerary_id"},
									"type":         "$$entry.type",
									"title":        "$$entry.title",
									"description":  "$$entry.description",
									"place_id": bson.M{
										"$cond": bson.A{
											bson.M{"$ne": bson.A{"$$entry.place_id", nil}},
											bson.M{"$toString": "$$entry.place_id"},
											nil,
										},
									},
									"place": "$$entry.place",
									"start_time":      "$$entry.start_time",
									"end_time":        "$$entry.end_time",
									"duration":        "$$entry.duration",
									"budget":          "$$entry.budget",
									"photos":          "$$entry.photos",
									"unsplash_photos": "$$entry.unsplash_photos",
									"order":           "$$entry.order",
									"todos":           "$$entry.todos",
									"created_at":      "$$entry.created_at",
									"updated_at":      "$$entry.updated_at",
								},
							},
						},
					},
				},
			},
			// Convert expenses IDs to strings
			"expenses": bson.M{
				"$map": bson.M{
					"input": "$expenses",
					"as":    "exp",
					"in": bson.M{
						"_id":          bson.M{"$toString": "$$exp._id"},
						"trip_id":      bson.M{"$toString": "$$exp.trip_id"},
						"entry_id":     bson.M{"$toString": "$$exp.entry_id"},
						"description":  "$$exp.description",
						"amount":       "$$exp.amount",
						"currency":     "$$exp.currency",
						"category":     "$$exp.category",
						"date":         "$$exp.date",
						"paid_by":      "$$exp.paid_by",
						"split_type":   "$$exp.split_type",
						"split_with":   "$$exp.split_with",
						"status":       "$$exp.status",
						"created_at":   "$$exp.created_at",
						"updated_at":   "$$exp.updated_at",
					},
				},
			},
		}},
	}

	cursor, err := mgm.Coll(&models.Trip{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	// Decode directly into TripDetailResponse struct with bson tags
	// IDs are already converted to strings by the aggregation pipeline
	var results []schemas.TripDetailResponse
	if err = cursor.All(ctx, &results); err != nil {
		logger.Error(err)
		return nil, err
	}

	if len(results) == 0 {
		logger.Error(errors.New("trip not found"))
		return nil, errors.New("trip not found")
	}

	// Populate place data for entries
	tripDetail := &results[0]
	placeRepo := NewPlaceRepository()

	logger.Info(fmt.Sprintf("DEBUG: Processing %d itineraries", len(tripDetail.Itineraries)))

	for itinIdx := range tripDetail.Itineraries {
		logger.Info(fmt.Sprintf("DEBUG: Itinerary %d has %d entries", itinIdx, len(tripDetail.Itineraries[itinIdx].Entries)))

		for entryIdx := range tripDetail.Itineraries[itinIdx].Entries {
			entry := &tripDetail.Itineraries[itinIdx].Entries[entryIdx]

			logger.Info(fmt.Sprintf("DEBUG: Entry type=%s, placeID=%v", entry.Type, entry.PlaceID))

			// Skip if no place_id or not a place type
			if entry.PlaceID == nil || *entry.PlaceID == "" || entry.Type != "place" {
				logger.Info("DEBUG: Skipping entry (no placeID or not place type)")
				continue
			}

			logger.Info(fmt.Sprintf("DEBUG: Fetching place with ID: %s", *entry.PlaceID))

			// Convert string ID to ObjectID
			placeObjID, err := primitive.ObjectIDFromHex(*entry.PlaceID)
			if err != nil {
				logger.Warn(fmt.Sprintf("Invalid place ID: %s", *entry.PlaceID))
				continue
			}

			// Fetch place data
			place, err := placeRepo.FindByID(ctx, placeObjID.Hex())
			if err != nil {
				logger.Warn(fmt.Sprintf("Failed to fetch place: %s, error: %v", *entry.PlaceID, err))
				continue
			}

			logger.Info(fmt.Sprintf("DEBUG: Place fetched successfully: %s", place.Name))

			// Convert Place model to response format
			placeID := place.ID.Hex()
			entry.Place = &schemas.PlaceResponse{
				ID:              &placeID,
				GooglePlaceID:   &place.GooglePlaceID,
				Name:            &place.Name,
				Address:         &place.Address,
				Location:        place.Location,
				Phone:           place.Phone,
				Website:         place.Website,
				Rating:          place.Rating,
				UserRatingsTotal: place.UserRatingsTotal,
				PriceLevel:      place.PriceLevel,
				EditorialSummary: place.EditorialSummary,
				Reviews:         place.Reviews,
				Categories:      place.Categories,
				Photos:          place.Photos,
				OpeningHours:    place.OpeningHours,
				CachedAt:        &place.CachedAt,
				CacheExpiresAt:  &place.CacheExpiresAt,
			}

			logger.Info(fmt.Sprintf("DEBUG: Place assigned to entry, place name: %v", entry.Place.Name))
		}
	}

	logger.Output(map[string]interface{}{
		"tripID": id,
	})
	return tripDetail, nil
}
