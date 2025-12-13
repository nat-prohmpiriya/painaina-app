package services

import (
	"context"
	"errors"
	"sort"
	"strconv"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/internal/schemas"
	"backend-go/pkg/utils"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type ItineraryService struct {
	itineraryRepo *repository.ItineraryRepository
	entryRepo     *repository.ItineraryEntryRepository
	placeRepo     *repository.PlaceRepository
	tripRepo      *repository.TripRepository
	tracer        trace.Tracer
}

func NewItineraryService() *ItineraryService {
	return &ItineraryService{
		itineraryRepo: repository.NewItineraryRepository(),
		entryRepo:     repository.NewItineraryEntryRepository(),
		placeRepo:     repository.NewPlaceRepository(),
		tripRepo:      repository.NewTripRepository(),
		tracer:        otel.Tracer("itinerary-service"),
	}
}

// GetItinerariesByTripID gets all itineraries (days) for a trip with their entries (1 query via aggregation)
func (s *ItineraryService) GetItinerariesByTripID(ctx context.Context, tripID string) ([]*models.Itinerary, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.GetItinerariesByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"tripID": tripID})

	// Use aggregation to get itineraries with entries in 1 query
	itineraries, err := s.itineraryRepo.FindByTripIDWithEntries(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(itineraries)})
	return itineraries, nil
}

// GetItinerary gets a specific itinerary (day) by ID with its entries (1 query via aggregation)
func (s *ItineraryService) GetItinerary(ctx context.Context, itineraryID string) (*models.Itinerary, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.GetItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	// Use aggregation to get itinerary with entries in 1 query
	itinerary, err := s.itineraryRepo.FindByIDWithEntries(ctx, itineraryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(itinerary)
	return itinerary, nil
}

// CreateItinerary creates a new itinerary (day) for a trip
func (s *ItineraryService) CreateItinerary(ctx context.Context, tripID string, dayNumber int, date, title string, order int) (*models.Itinerary, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.CreateItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":    tripID,
		"dayNumber": dayNumber,
		"title":     title,
	})

	// Use repository helper to create itinerary with ObjectID
	itinerary, err := s.itineraryRepo.NewItinerary(tripID)
	if err != nil {
		err := errors.New("invalid trip ID")
		logger.Error(err)
		return nil, err
	}

	// Set other fields
	itinerary.DayNumber = dayNumber
	itinerary.Date = date
	itinerary.Title = title
	itinerary.Order = order

	if err := s.itineraryRepo.Create(ctx, itinerary); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"itineraryID": itinerary.ID.Hex()})
	return itinerary, nil
}

// UpdateItinerary updates an itinerary (day)
func (s *ItineraryService) UpdateItinerary(ctx context.Context, itineraryID string, title *string, date *string, order *int) (*models.Itinerary, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.UpdateItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	itinerary, err := s.itineraryRepo.FindByID(ctx, itineraryID)
	if err != nil {
		err := errors.New("itinerary not found")
		logger.Error(err)
		return nil, err
	}

	if title != nil {
		itinerary.Title = *title
	}
	if date != nil {
		itinerary.Date = *date
	}
	if order != nil {
		itinerary.Order = *order
	}

	if err := s.itineraryRepo.Update(ctx, itinerary); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(itinerary)
	return itinerary, nil
}

// DeleteItinerary deletes an itinerary (day) and all its entries
// It also shifts remaining itineraries and updates trip dates accordingly
func (s *ItineraryService) DeleteItinerary(ctx context.Context, itineraryID string) error {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.DeleteItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	// 1. Get itinerary to delete
	itinerary, err := s.itineraryRepo.FindByID(ctx, itineraryID)
	if err != nil {
		err := errors.New("itinerary not found")
		logger.Error(err)
		return err
	}

	// 2. Validation: Prevent deleting last remaining day
	totalItineraries, err := s.itineraryRepo.CountByTripID(ctx, itinerary.TripID.Hex())
	if err != nil {
		logger.Error(err)
		return err
	}

	if totalItineraries <= 1 {
		err := errors.New("cannot delete the last day of a trip")
		logger.Error(err)
		return err
	}

	// 3. Get trip for updating dates later
	trip, err := s.tripRepo.FindByID(ctx, itinerary.TripID.Hex())
	if err != nil {
		err := errors.New("trip not found")
		logger.Error(err)
		return err
	}

	// 4. Delete all entries first
	if err := s.entryRepo.DeleteByItineraryID(ctx, itineraryID); err != nil {
		logger.Error(err)
		return err
	}

	// 5. Delete the itinerary
	if err := s.itineraryRepo.Delete(ctx, itineraryID); err != nil {
		logger.Error(err)
		return err
	}

	// 6. Get all remaining itineraries and sort by order
	allItineraries, err := s.itineraryRepo.FindByTripID(ctx, itinerary.TripID.Hex())
	if err != nil {
		logger.Error(err)
		return err
	}

	sort.Slice(allItineraries, func(i, j int) bool {
		return allItineraries[i].Order < allItineraries[j].Order
	})

	// 7. Shift itineraries that have dayNumber > deleted one
	for _, itin := range allItineraries {
		if itin.DayNumber > itinerary.DayNumber {
			// Shift dayNumber and order down by 1
			itin.DayNumber--
			itin.Order--

			// Shift date down by 1 day
			if itin.Date != "" {
				dateTime, err := time.Parse("2006-01-02", itin.Date)
				if err != nil {
					logger.Error(err)
					return err
				}
				newDate := dateTime.AddDate(0, 0, -1)
				itin.Date = newDate.Format("2006-01-02")
			}

			if err := s.itineraryRepo.Update(ctx, itin); err != nil {
				logger.Error(err)
				return err
			}
		}
	}

	// 8. Update trip dates
	if itinerary.DayNumber == 1 {
		// Deleting Day 1 → shift startDate to next day
		if !trip.StartDate.IsZero() {
			trip.StartDate = trip.StartDate.AddDate(0, 0, 1)
			logger.Info("Shifted trip startDate forward by 1 day")
		}
	} else {
		// Deleting other days → reduce endDate by 1 day
		if !trip.EndDate.IsZero() {
			trip.EndDate = trip.EndDate.AddDate(0, 0, -1)
			logger.Info("Reduced trip endDate by 1 day")
		}
	}

	if err := s.tripRepo.Update(ctx, trip); err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"deletedDayNumber": itinerary.DayNumber,
		"shiftedDays":      len(allItineraries),
	})
	logger.Info("Itinerary deleted and dates updated successfully")
	return nil
}

// GetEntriesByItineraryID gets all entries for an itinerary (day)
func (s *ItineraryService) GetEntriesByItineraryID(ctx context.Context, itineraryID string) ([]*models.ItineraryEntry, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.GetEntriesByItineraryID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	entries, err := s.entryRepo.FindByItineraryID(ctx, itineraryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(entries)})
	return entries, nil
}

// GetEntry gets a specific entry by ID
func (s *ItineraryService) GetEntry(ctx context.Context, entryID string) (*models.ItineraryEntry, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.GetEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"entryID": entryID})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(entry)
	return entry, nil
}

// CreateEntry creates a new entry in an itinerary (day)
func (s *ItineraryService) CreateEntry(
	ctx context.Context,
	itineraryID string,
	entryType models.EntryType,
	title, description string,
	placeID *string,
	placeData interface{}, // schemas.PlaceData from handler
	startTime, endTime *string,
	order *int,
	todos []models.Todo,
) (*models.ItineraryEntry, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.CreateEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID": itineraryID,
		"entryType":   entryType,
		"title":       title,
	})

	// Use repository helper to create entry with ObjectID
	entry, err := s.entryRepo.NewEntry(itineraryID)
	if err != nil {
		err := errors.New("invalid itinerary ID")
		logger.Error(err)
		return nil, err
	}

	// Set other fields
	entry.Type = entryType
	entry.Title = title
	entry.Description = &description
	entry.StartTime = startTime
	entry.EndTime = endTime
	if order != nil {
		entry.Order = *order
	}

	// Generate IDs for todos if not present
	for i := range todos {
		if todos[i].ID == "" {
			todos[i].ID = primitive.NewObjectID().Hex()
		}
	}
	entry.Todos = todos

	// Handle place data from frontend
	logger.Output(map[string]interface{}{
		"placeData": placeData,
		"isNil":     placeData == nil,
	})
	if placeData != nil {
		// Type assert to *schemas.PlaceData
		if pd, ok := placeData.(*schemas.PlaceData); ok && pd != nil {
			logger.Output(map[string]interface{}{"googlePlaceID": pd.PlaceID})
			if pd.PlaceID != "" {
				// Try to find existing place by Google Place ID
				existingPlace, err := s.placeRepo.FindByGooglePlaceID(ctx, pd.PlaceID)
				if err != nil {
					// Place doesn't exist, create it
					place := s.convertPlaceDataToModel(pd)
					if err := s.placeRepo.Create(ctx, place); err != nil {
						logger.Error(err)
						return nil, err
					}
					entry.PlaceID = &place.ID
					logger.Info("Created new place for entry")
				} else {
					// Place exists, use its ID
					entry.PlaceID = &existingPlace.ID
					logger.Info("Using existing place for entry")
				}
			}
		}
	} else if placeID != nil && *placeID != "" {
		// Fallback to old behavior for backward compatibility
		if err := s.entryRepo.SetPlaceID(entry, *placeID); err != nil {
			err := errors.New("invalid place ID")
			logger.Error(err)
			return nil, err
		}
	}

	if err := s.entryRepo.Create(ctx, entry); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"entryID": entry.ID.Hex()})
	return entry, nil
}

// convertPlaceDataToModel converts schema PlaceData to models.Place
func (s *ItineraryService) convertPlaceDataToModel(data *schemas.PlaceData) *models.Place {
	place := &models.Place{
		GooglePlaceID: data.PlaceID,
		Name:          data.Name,
	}

	// Convert location
	place.Location = models.GeoPoint{
		Type:        "Point",
		Coordinates: []float64{data.Location.Lng, data.Location.Lat}, // MongoDB uses [lng, lat]
		Latitude:    data.Location.Lat,
		Longitude:   data.Location.Lng,
	}

	// Convert photo reference
	if data.PhotoReference != nil && *data.PhotoReference != "" {
		place.Photos = []models.PlacePhoto{
			{PhotoReference: *data.PhotoReference},
		}
	}

	// Convert types
	if len(data.Types) > 0 {
		place.Categories = data.Types
	}

	return place
}

// UpdateEntry updates an entry
func (s *ItineraryService) UpdateEntry(
	ctx context.Context,
	entryID string,
	title, description *string,
	startTime, endTime *string,
	order *int,
	todos *[]models.Todo,
) (*models.ItineraryEntry, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.UpdateEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"entryID": entryID})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		err := errors.New("entry not found")
		logger.Error(err)
		return nil, err
	}

	if title != nil {
		entry.Title = *title
	}
	if description != nil {
		entry.Description = description
	}
	if startTime != nil {
		entry.StartTime = startTime
	}
	if endTime != nil {
		entry.EndTime = endTime
	}
	if order != nil {
		entry.Order = *order
	}
	if todos != nil {
		entry.Todos = *todos
	}

	if err := s.entryRepo.Update(ctx, entry); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(entry)
	return entry, nil
}

// DeleteEntry deletes an entry
func (s *ItineraryService) DeleteEntry(ctx context.Context, entryID string) error {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.DeleteEntry")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"entryID": entryID})

	err := s.entryRepo.Delete(ctx, entryID)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Entry deleted successfully")
	return nil
}

// UpdateTodos updates todos for an entry
func (s *ItineraryService) UpdateTodos(ctx context.Context, entryID string, todos []models.Todo) error {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.UpdateTodos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID":    entryID,
		"todosCount": len(todos),
	})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		err := errors.New("entry not found")
		logger.Error(err)
		return err
	}

	// Generate IDs for new todos (ones without ID)
	for i := range todos {
		if todos[i].ID == "" {
			todos[i].ID = primitive.NewObjectID().Hex()
		}
	}

	entry.Todos = todos

	err = s.entryRepo.Update(ctx, entry)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Todos updated successfully")
	return nil
}

// ToggleTodo toggles a todo's completed status by ID
func (s *ItineraryService) ToggleTodo(ctx context.Context, entryID string, todoID string) error {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.ToggleTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"todoID":  todoID,
	})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		err := errors.New("entry not found")
		logger.Error(err)
		return err
	}

	// Find todo by ID
	todoFound := false
	for i := range entry.Todos {
		if entry.Todos[i].ID == todoID {
			entry.Todos[i].Completed = !entry.Todos[i].Completed
			todoFound = true
			break
		}
	}

	if !todoFound {
		err := errors.New("todo not found")
		logger.Error(err)
		return err
	}

	err = s.entryRepo.Update(ctx, entry)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Todo toggled successfully")
	return nil
}

// CreateTodo creates a new todo in an entry
func (s *ItineraryService) CreateTodo(ctx context.Context, entryID string, title string, order int) (*models.Todo, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.CreateTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"title":   title,
		"order":   order,
	})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		err := errors.New("entry not found")
		logger.Error(err)
		return nil, err
	}

	// Generate ID for new todo
	newTodo := models.Todo{
		ID:        primitive.NewObjectID().Hex(),
		Title:     title,
		Completed: false,
		Order:     order,
	}

	// Append to existing todos
	entry.Todos = append(entry.Todos, newTodo)

	err = s.entryRepo.Update(ctx, entry)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"todoID": newTodo.ID,
	})
	logger.Info("Todo created successfully")
	return &newTodo, nil
}

// UpdateTodo updates a todo's title
func (s *ItineraryService) UpdateTodo(ctx context.Context, entryID string, todoID string, title string) error {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.UpdateTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"todoID":  todoID,
		"title":   title,
	})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		err := errors.New("entry not found")
		logger.Error(err)
		return err
	}

	// Find and update todo by ID
	todoFound := false
	for i := range entry.Todos {
		if entry.Todos[i].ID == todoID {
			entry.Todos[i].Title = title
			todoFound = true
			break
		}
	}

	if !todoFound {
		err := errors.New("todo not found")
		logger.Error(err)
		return err
	}

	err = s.entryRepo.Update(ctx, entry)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Todo updated successfully")
	return nil
}

// DeleteTodo deletes a todo by ID
func (s *ItineraryService) DeleteTodo(ctx context.Context, entryID string, todoID string) error {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.DeleteTodo")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID": entryID,
		"todoID":  todoID,
	})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		err := errors.New("entry not found")
		logger.Error(err)
		return err
	}

	// Find and remove todo by ID
	todoIndex := -1
	for i := range entry.Todos {
		if entry.Todos[i].ID == todoID {
			todoIndex = i
			break
		}
	}

	if todoIndex == -1 {
		err := errors.New("todo not found")
		logger.Error(err)
		return err
	}

	// Remove todo from slice
	entry.Todos = append(entry.Todos[:todoIndex], entry.Todos[todoIndex+1:]...)

	err = s.entryRepo.Update(ctx, entry)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Todo deleted successfully")
	return nil
}

// ReorderTodos reorders todos based on the provided list of IDs
func (s *ItineraryService) ReorderTodos(ctx context.Context, entryID string, todoIDs []string) (*models.ItineraryEntry, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.ReorderTodos")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"entryID":     entryID,
		"todoIDCount": len(todoIDs),
	})

	entry, err := s.entryRepo.FindByID(ctx, entryID)
	if err != nil {
		err := errors.New("entry not found")
		logger.Error(err)
		return nil, err
	}

	// Create a map of existing todos by ID for quick lookup
	todoMap := make(map[string]models.Todo)
	for _, todo := range entry.Todos {
		todoMap[todo.ID] = todo
	}

	// Reorder todos based on the provided IDs
	reorderedTodos := make([]models.Todo, 0, len(todoIDs))
	for i, todoID := range todoIDs {
		if todo, exists := todoMap[todoID]; exists {
			todo.Order = i
			reorderedTodos = append(reorderedTodos, todo)
		}
	}

	// Validate that all todos are accounted for
	if len(reorderedTodos) != len(entry.Todos) {
		err := errors.New("todo count mismatch: some todos are missing in the reorder list")
		logger.Error(err)
		return nil, err
	}

	entry.Todos = reorderedTodos

	err = s.entryRepo.Update(ctx, entry)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Info("Todos reordered successfully")
	return entry, nil
}

// ReorderEntries reorders entries within an itinerary by updating their order field
func (s *ItineraryService) ReorderEntries(ctx context.Context, itineraryID string, entryIDs []string) ([]*models.ItineraryEntry, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.ReorderEntries")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"itineraryID":   itineraryID,
		"entryIDCount": len(entryIDs),
	})

	// Get all entries for this itinerary
	entries, err := s.entryRepo.FindByItineraryID(ctx, itineraryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Create a map of existing entries by ID for quick lookup
	entryMap := make(map[string]*models.ItineraryEntry)
	for _, entry := range entries {
		entryMap[entry.ID.Hex()] = entry
	}

	// Validate that all entries are accounted for
	if len(entryIDs) != len(entries) {
		err := errors.New("entry count mismatch: some entries are missing in the reorder list")
		logger.Error(err)
		return nil, err
	}

	// Update order for each entry
	for i, entryID := range entryIDs {
		if entry, exists := entryMap[entryID]; exists {
			entry.Order = i
			if err := s.entryRepo.Update(ctx, entry); err != nil {
				logger.Error(err)
				return nil, err
			}
		} else {
			err := errors.New("entry not found: " + entryID)
			logger.Error(err)
			return nil, err
		}
	}

	logger.Info("Entries reordered successfully")

	// Fetch entries with place data aggregated for response
	entriesWithPlaces, err := s.entryRepo.FindByItineraryIDWithPlaces(ctx, itineraryID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	return entriesWithPlaces, nil
}

// CountEntriesByItinerary counts entries in an itinerary (day)
func (s *ItineraryService) CountEntriesByItinerary(ctx context.Context, itineraryID string) (int64, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.CountEntriesByItinerary")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"itineraryID": itineraryID})

	count, err := s.entryRepo.CountByItineraryID(ctx, itineraryID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{"count": count})
	return count, nil
}

// CountItinerariesByTrip counts itineraries (days) for a trip
func (s *ItineraryService) CountItinerariesByTrip(ctx context.Context, tripID string) (int64, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.CountItinerariesByTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"tripID": tripID})

	count, err := s.itineraryRepo.CountByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{"count": count})
	return count, nil
}

// InsertItineraryAfter inserts a new itinerary after the specified itinerary
// It shifts all subsequent itineraries' dayNumber and date by 1, and extends trip's endDate
func (s *ItineraryService) InsertItineraryAfter(ctx context.Context, tripID, itineraryID, userID string) (*models.Itinerary, error) {
	ctx, span := s.tracer.Start(ctx, "ItineraryService.InsertItineraryAfter")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":      tripID,
		"itineraryID": itineraryID,
		"userID":      userID,
	})

	// 1. Verify trip exists and user owns it
	trip, err := s.tripRepo.FindByID(ctx, tripID)
	if err != nil {
		err := errors.New("trip not found")
		logger.Error(err)
		return nil, err
	}

	if trip.OwnerID.Hex() != userID {
		err := errors.New("unauthorized: you don't own this trip")
		logger.Error(err)
		return nil, err
	}

	// 2. Get the itinerary to insert after
	currentItinerary, err := s.itineraryRepo.FindByID(ctx, itineraryID)
	if err != nil {
		err := errors.New("itinerary not found")
		logger.Error(err)
		return nil, err
	}

	// 3. Get all itineraries for this trip and sort by order
	allItineraries, err := s.itineraryRepo.FindByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Sort by order to ensure correct sequence
	sort.Slice(allItineraries, func(i, j int) bool {
		return allItineraries[i].Order < allItineraries[j].Order
	})

	// 4. Collect itineraries that need to be shifted
	var toUpdate []*models.Itinerary
	for _, itin := range allItineraries {
		if itin.DayNumber > currentItinerary.DayNumber {
			// Shift dayNumber and order
			itin.DayNumber++
			itin.Order++

			// Shift date by 1 day
			if itin.Date != "" {
				dateTime, err := time.Parse("2006-01-02", itin.Date)
				if err != nil {
					logger.Error(err)
					return nil, err
				}
				newDate := dateTime.AddDate(0, 0, 1)
				itin.Date = newDate.Format("2006-01-02")
			}

			toUpdate = append(toUpdate, itin)
		}
	}

	// Batch update all shifted itineraries
	for _, itin := range toUpdate {
		if err := s.itineraryRepo.Update(ctx, itin); err != nil {
			logger.Error(err)
			return nil, err
		}
	}

	// 5. Create new itinerary at position currentDayNumber + 1
	newItinerary, err := s.itineraryRepo.NewItinerary(tripID)
	if err != nil {
		err := errors.New("invalid trip ID")
		logger.Error(err)
		return nil, err
	}

	newItinerary.DayNumber = currentItinerary.DayNumber + 1
	newItinerary.Title = "Day " + strconv.Itoa(newItinerary.DayNumber)
	newItinerary.Order = currentItinerary.Order + 1

	// Calculate new date (current date + 1 day)
	if currentItinerary.Date != "" {
		dateTime, err := time.Parse("2006-01-02", currentItinerary.Date)
		if err != nil {
			logger.Error(err)
			return nil, err
		}
		newDate := dateTime.AddDate(0, 0, 1)
		newItinerary.Date = newDate.Format("2006-01-02")
	}

	if err := s.itineraryRepo.Create(ctx, newItinerary); err != nil {
		logger.Error(err)
		return nil, err
	}

	// 6. Extend trip's endDate by 1 day
	if !trip.EndDate.IsZero() {
		trip.EndDate = trip.EndDate.AddDate(0, 0, 1)
		if err := s.tripRepo.Update(ctx, trip); err != nil {
			logger.Error(err)
			return nil, err
		}
		logger.Info("Extended trip endDate by 1 day")
	}

	logger.Output(map[string]interface{}{
		"newItineraryID": newItinerary.ID.Hex(),
		"dayNumber":      newItinerary.DayNumber,
		"date":           newItinerary.Date,
	})
	return newItinerary, nil
}
