package services

import (
	"time"

	"backend-go/pkg/sse"
)

// TripSyncService handles real-time trip synchronization via SSE
type TripSyncService struct {
	hub *sse.Hub
}

// NewTripSyncService creates a new TripSyncService
func NewTripSyncService(hub *sse.Hub) *TripSyncService {
	return &TripSyncService{
		hub: hub,
	}
}

// Resource types
const (
	ResourceTrip      = "trip"
	ResourceItinerary = "itinerary"
	ResourceEntry     = "entry"
	ResourceExpense   = "expense"
	ResourcePacking   = "packing"
	ResourceMember    = "member"
	ResourceComment   = "comment"
)

// Action types
const (
	ActionCreated = "created"
	ActionUpdated = "updated"
	ActionDeleted = "deleted"
)

// BroadcastTripUpdate broadcasts a trip update event to all subscribers
func (s *TripSyncService) BroadcastTripUpdate(tripID, userID, resource, action string, data map[string]interface{}) {
	if s.hub == nil {
		return
	}

	event := sse.TripSyncEvent{
		Type:      resource + "_" + action,
		TripID:    tripID,
		Action:    action,
		Resource:  resource,
		Data:      data,
		UserID:    userID,
		Timestamp: time.Now().UnixMilli(),
	}

	// Broadcast to all subscribers except the user who made the change
	s.hub.BroadcastTripUpdate(tripID, userID, event)
}

// BroadcastTripCreated broadcasts a trip created event
func (s *TripSyncService) BroadcastTripCreated(tripID, userID string, data map[string]interface{}) {
	s.BroadcastTripUpdate(tripID, userID, ResourceTrip, ActionCreated, data)
}

// BroadcastTripUpdated broadcasts a trip updated event
func (s *TripSyncService) BroadcastTripUpdated(tripID, userID string, data map[string]interface{}) {
	s.BroadcastTripUpdate(tripID, userID, ResourceTrip, ActionUpdated, data)
}

// BroadcastTripDeleted broadcasts a trip deleted event
func (s *TripSyncService) BroadcastTripDeleted(tripID, userID string) {
	s.BroadcastTripUpdate(tripID, userID, ResourceTrip, ActionDeleted, nil)
}

// BroadcastItineraryCreated broadcasts an itinerary created event
func (s *TripSyncService) BroadcastItineraryCreated(tripID, userID, itineraryID string, data map[string]interface{}) {
	if data == nil {
		data = make(map[string]interface{})
	}
	data["itineraryId"] = itineraryID
	s.BroadcastTripUpdate(tripID, userID, ResourceItinerary, ActionCreated, data)
}

// BroadcastItineraryUpdated broadcasts an itinerary updated event
func (s *TripSyncService) BroadcastItineraryUpdated(tripID, userID, itineraryID string, data map[string]interface{}) {
	if data == nil {
		data = make(map[string]interface{})
	}
	data["itineraryId"] = itineraryID
	s.BroadcastTripUpdate(tripID, userID, ResourceItinerary, ActionUpdated, data)
}

// BroadcastItineraryDeleted broadcasts an itinerary deleted event
func (s *TripSyncService) BroadcastItineraryDeleted(tripID, userID, itineraryID string) {
	data := map[string]interface{}{
		"itineraryId": itineraryID,
	}
	s.BroadcastTripUpdate(tripID, userID, ResourceItinerary, ActionDeleted, data)
}

// BroadcastEntryCreated broadcasts an entry created event
func (s *TripSyncService) BroadcastEntryCreated(tripID, userID, itineraryID, entryID string, data map[string]interface{}) {
	if data == nil {
		data = make(map[string]interface{})
	}
	data["itineraryId"] = itineraryID
	data["entryId"] = entryID
	s.BroadcastTripUpdate(tripID, userID, ResourceEntry, ActionCreated, data)
}

// BroadcastEntryUpdated broadcasts an entry updated event
func (s *TripSyncService) BroadcastEntryUpdated(tripID, userID, itineraryID, entryID string, data map[string]interface{}) {
	if data == nil {
		data = make(map[string]interface{})
	}
	data["itineraryId"] = itineraryID
	data["entryId"] = entryID
	s.BroadcastTripUpdate(tripID, userID, ResourceEntry, ActionUpdated, data)
}

// BroadcastEntryDeleted broadcasts an entry deleted event
func (s *TripSyncService) BroadcastEntryDeleted(tripID, userID, itineraryID, entryID string) {
	data := map[string]interface{}{
		"itineraryId": itineraryID,
		"entryId":     entryID,
	}
	s.BroadcastTripUpdate(tripID, userID, ResourceEntry, ActionDeleted, data)
}

// BroadcastExpenseCreated broadcasts an expense created event
func (s *TripSyncService) BroadcastExpenseCreated(tripID, userID, expenseID string, data map[string]interface{}) {
	if data == nil {
		data = make(map[string]interface{})
	}
	data["expenseId"] = expenseID
	s.BroadcastTripUpdate(tripID, userID, ResourceExpense, ActionCreated, data)
}

// BroadcastExpenseUpdated broadcasts an expense updated event
func (s *TripSyncService) BroadcastExpenseUpdated(tripID, userID, expenseID string, data map[string]interface{}) {
	if data == nil {
		data = make(map[string]interface{})
	}
	data["expenseId"] = expenseID
	s.BroadcastTripUpdate(tripID, userID, ResourceExpense, ActionUpdated, data)
}

// BroadcastExpenseDeleted broadcasts an expense deleted event
func (s *TripSyncService) BroadcastExpenseDeleted(tripID, userID, expenseID string) {
	data := map[string]interface{}{
		"expenseId": expenseID,
	}
	s.BroadcastTripUpdate(tripID, userID, ResourceExpense, ActionDeleted, data)
}

// BroadcastPackingUpdated broadcasts a packing list updated event
func (s *TripSyncService) BroadcastPackingUpdated(tripID, userID string, data map[string]interface{}) {
	s.BroadcastTripUpdate(tripID, userID, ResourcePacking, ActionUpdated, data)
}

// BroadcastMemberJoined broadcasts a member joined event
func (s *TripSyncService) BroadcastMemberJoined(tripID, userID, memberID string, data map[string]interface{}) {
	if data == nil {
		data = make(map[string]interface{})
	}
	data["memberId"] = memberID
	s.BroadcastTripUpdate(tripID, userID, ResourceMember, ActionCreated, data)
}

// BroadcastMemberLeft broadcasts a member left event
func (s *TripSyncService) BroadcastMemberLeft(tripID, userID, memberID string) {
	data := map[string]interface{}{
		"memberId": memberID,
	}
	s.BroadcastTripUpdate(tripID, userID, ResourceMember, ActionDeleted, data)
}

// GetSubscriberCount returns the number of subscribers for a trip
func (s *TripSyncService) GetSubscriberCount(tripID string) int {
	if s.hub == nil {
		return 0
	}
	return s.hub.GetTripSubscriberCount(tripID)
}
