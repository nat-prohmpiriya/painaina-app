package models

import (
	"encoding/json"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ItineraryEntry represents an activity/place in a day
type ItineraryEntry struct {
	mgm.DefaultModel `bson:",inline"`

	ItineraryID primitive.ObjectID  `bson:"itinerary_id" json:"itineraryId"` // Reference to Itinerary (day)
	Type        EntryType           `bson:"type" json:"type"`                // place, note, todos
	Title       string              `bson:"title" json:"title"`
	Description *string             `bson:"description,omitempty" json:"description,omitempty"`
	PlaceID     *primitive.ObjectID `bson:"place_id,omitempty" json:"placeId,omitempty"` // Reference to Place collection
	Place       *Place              `bson:"place,omitempty" json:"place,omitempty"`      // Populated place data from aggregation
	StartTime   *string             `bson:"start_time,omitempty" json:"startTime,omitempty"`
	EndTime     *string             `bson:"end_time,omitempty" json:"endTime,omitempty"`
	Duration    *int                `bson:"duration,omitempty" json:"duration,omitempty"` // in minutes
	Budget      *float64            `bson:"budget,omitempty" json:"budget,omitempty"`
	Photos      []string            `bson:"photos,omitempty" json:"photos,omitempty"`
	Order       int                 `bson:"order" json:"order"`                     // Order within the day
	Todos       []Todo              `bson:"todos,omitempty" json:"todos,omitempty"` // Embedded todos
}

// MarshalJSON customizes JSON marshaling to map MongoDB _id to id and use camelCase
func (e ItineraryEntry) MarshalJSON() ([]byte, error) {
	type Alias ItineraryEntry
	return json.Marshal(&struct {
		ID        string    `json:"id"`
		CreatedAt time.Time `json:"createdAt"`
		UpdatedAt time.Time `json:"updatedAt"`
		*Alias
	}{
		ID:        e.ID.Hex(),
		CreatedAt: e.CreatedAt,
		UpdatedAt: e.UpdatedAt,
		Alias:     (*Alias)(&e),
	})
}

// EntryType represents the type of itinerary entry
type EntryType string

const (
	EntryTypePlace EntryType = "place"
	EntryTypeNote  EntryType = "note"
	EntryTypeTodos EntryType = "todos"
)

// UnsplashPhoto represents Unsplash photo data
type UnsplashPhoto struct {
	ID          string `bson:"id" json:"id"`
	URLs        URLs   `bson:"urls" json:"urls"`
	Description string `bson:"description,omitempty" json:"description,omitempty"`
	AltText     string `bson:"alt_text,omitempty" json:"altText,omitempty"`
}

// URLs represents Unsplash photo URLs
type URLs struct {
	Raw     string `bson:"raw" json:"raw"`
	Full    string `bson:"full" json:"full"`
	Regular string `bson:"regular" json:"regular"`
	Small   string `bson:"small" json:"small"`
	Thumb   string `bson:"thumb" json:"thumb"`
}

// Todo represents an embedded todo item within an entry
type Todo struct {
	ID        string `bson:"id" json:"id"`
	Title     string `bson:"title" json:"title"`
	Completed bool   `bson:"completed" json:"completed"`
	Order     int    `bson:"order" json:"order"`
}

// CollectionName returns the collection name for ItineraryEntry
func (e *ItineraryEntry) CollectionName() string {
	return "itinerary_entries"
}

// AddTodo adds a todo to the entry
func (e *ItineraryEntry) AddTodo(title string, order int) {
	todo := Todo{
		ID:        primitive.NewObjectID().Hex(),
		Title:     title,
		Completed: false,
		Order:     order,
	}
	e.Todos = append(e.Todos, todo)
}

// CompleteTodo marks a todo as completed by order
func (e *ItineraryEntry) CompleteTodo(order int) {
	for i := range e.Todos {
		if e.Todos[i].Order == order {
			e.Todos[i].Completed = true
			break
		}
	}
}

// UncompleteTodo marks a todo as not completed by order
func (e *ItineraryEntry) UncompleteTodo(order int) {
	for i := range e.Todos {
		if e.Todos[i].Order == order {
			e.Todos[i].Completed = false
			break
		}
	}
}
