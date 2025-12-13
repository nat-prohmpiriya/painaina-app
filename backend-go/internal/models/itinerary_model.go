package models

import (
	"encoding/json"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Itinerary represents a day in the trip itinerary
type Itinerary struct {
	mgm.DefaultModel `bson:",inline"`

	TripID    primitive.ObjectID `bson:"trip_id" json:"tripId"`
	DayNumber int                `bson:"day_number" json:"dayNumber"` // 1, 2, 3, ...
	Date      string             `bson:"date" json:"date"`            // ISO date format YYYY-MM-DD
	Title     string             `bson:"title" json:"title"`          // e.g., "Day 1: Exploring Bangkok"
	Order     int                `bson:"order" json:"order"`          // For sorting days
	Entries   []*ItineraryEntry  `bson:"-" json:"entries,omitempty"` // Populated when queried, not stored in DB
}

// MarshalJSON customizes JSON marshaling to map MongoDB _id to id and use camelCase
func (i Itinerary) MarshalJSON() ([]byte, error) {
	type Alias Itinerary
	return json.Marshal(&struct {
		ID        string    `json:"id"`
		CreatedAt time.Time `json:"createdAt"`
		UpdatedAt time.Time `json:"updatedAt"`
		*Alias
	}{
		ID:        i.ID.Hex(),
		CreatedAt: i.CreatedAt,
		UpdatedAt: i.UpdatedAt,
		Alias:     (*Alias)(&i),
	})
}

// CollectionName returns the collection name for Itinerary
func (i *Itinerary) CollectionName() string {
	return "itineraries"
}
