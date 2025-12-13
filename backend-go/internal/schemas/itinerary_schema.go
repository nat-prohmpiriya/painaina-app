package schemas

import "backend-go/internal/models"

// Itinerary schemas
type CreateItineraryRequest struct {
	DayNumber int    `json:"dayNumber" binding:"required,min=1"`
	Date      string `json:"date" binding:"required"`
	Title     string `json:"title" binding:"required,min=1,max=200"`
	Order     int    `json:"order" binding:"required,min=0"`
}

type UpdateItineraryRequest struct {
	Title *string `json:"title,omitempty" binding:"omitempty,min=1,max=200"`
	Date  *string `json:"date,omitempty"`
	Order *int    `json:"order,omitempty" binding:"omitempty,min=0"`
}

// PlaceData represents place information from frontend
type PlaceData struct {
	PlaceID        string      `json:"placeId"`
	Name           string      `json:"name"`
	Location       Coordinates `json:"location"`
	PhotoReference *string     `json:"photoReference,omitempty"`
	PhotoPlace     []string    `json:"photoPlace,omitempty"`
	Types          []string    `json:"types,omitempty"`
}

// Entry schemas
type CreateEntryRequest struct {
	Type        string        `json:"type" binding:"required,oneof=place note todos"`
	Title       string        `json:"title" binding:"required,min=1,max=200"`
	Description *string       `json:"description,omitempty" binding:"omitempty,max=1000"`
	PlaceID     *string       `json:"placeId,omitempty"` // For backward compatibility
	Place       *PlaceData    `json:"place,omitempty"`   // Place data from frontend
	StartTime   *string       `json:"startTime,omitempty"`
	EndTime     *string       `json:"endTime,omitempty"`
	Order       *int          `json:"order" binding:"required,min=0"`
	Todos       []models.Todo `json:"todos,omitempty"`
}

type UpdateEntryRequest struct {
	Title       *string        `json:"title,omitempty" binding:"omitempty,min=1,max=200"`
	Description *string        `json:"description,omitempty" binding:"omitempty,max=1000"`
	StartTime   *string        `json:"startTime,omitempty"`
	EndTime     *string        `json:"endTime,omitempty"`
	Order       *int           `json:"order,omitempty" binding:"omitempty,min=0"`
	Todos       *[]models.Todo `json:"todos,omitempty"`
}

type UpdateTodosRequest struct {
	Todos []models.Todo `json:"todos" binding:"required"`
}

// Todo schemas
type CreateTodoRequest struct {
	Title string `json:"title" binding:"required,min=1,max=200"`
	Order *int   `json:"order" binding:"required,min=0"`
}

type UpdateTodoRequest struct {
	Title *string `json:"title,omitempty" binding:"omitempty,min=1,max=200"`
}

type ReorderTodosRequest struct {
	TodoIDs []string `json:"todoIds" binding:"required,min=1"`
}

type ReorderEntriesRequest struct {
	EntryIDs []string `json:"entryIds" binding:"required,min=1"`
}

// Helper function to convert model to response
func ToItineraryEntryResponse(entry *models.ItineraryEntry) map[string]interface{} {
	todos := make([]map[string]interface{}, 0, len(entry.Todos))
	for _, todo := range entry.Todos {
		todos = append(todos, map[string]interface{}{
			"id":        todo.ID,
			"title":     todo.Title,
			"completed": todo.Completed,
			"order":     todo.Order,
		})
	}

	return map[string]interface{}{
		"id":          entry.ID.Hex(),
		"itineraryId": entry.ItineraryID,
		"type":        entry.Type,
		"title":       entry.Title,
		"description": entry.Description,
		"placeId":     entry.PlaceID,
		"startTime":   entry.StartTime,
		"endTime":     entry.EndTime,
		"duration":    entry.Duration,
		"budget":      entry.Budget,
		"order":       entry.Order,
		"todos":       todos,
		"createdAt":   entry.CreatedAt,
		"updatedAt":   entry.UpdatedAt,
	}
}
