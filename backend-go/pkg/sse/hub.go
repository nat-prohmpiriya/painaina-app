package sse

import (
	"encoding/json"
	"sync"
	"time"
)

// Event represents an SSE event to be sent to clients
type Event struct {
	Type        string `json:"type"`
	Timestamp   int64  `json:"timestamp"`
	UnreadCount int64  `json:"unreadCount,omitempty"`
}

// TripSyncEvent represents a real-time trip update event
type TripSyncEvent struct {
	Type      string                 `json:"type"`      // event type: trip_updated, itinerary_created, entry_updated, etc.
	TripID    string                 `json:"tripId"`    // the trip that was modified
	Action    string                 `json:"action"`    // created, updated, deleted
	Resource  string                 `json:"resource"`  // trip, itinerary, entry, expense, packing, member
	Data      map[string]interface{} `json:"data"`      // additional data (optional)
	UserID    string                 `json:"userId"`    // user who made the change
	Timestamp int64                  `json:"timestamp"`
}

// Client represents a connected SSE client
type Client struct {
	UserID  string
	Channel chan Event
}

// TripClient represents a client subscribed to a trip's updates
type TripClient struct {
	UserID      string
	TripID      string
	Channel     chan TripSyncEvent
}

// Hub manages SSE connections for all users
type Hub struct {
	// Map of userID to list of client channels (one user can have multiple connections)
	clients map[string][]*Client
	// Map of tripID to list of trip clients (for real-time trip sync)
	tripClients map[string][]*TripClient
	mu          sync.RWMutex
	tripMu      sync.RWMutex
}

// NewHub creates a new SSE Hub
func NewHub() *Hub {
	return &Hub{
		clients:     make(map[string][]*Client),
		tripClients: make(map[string][]*TripClient),
	}
}

// Register adds a new client connection for a user
func (h *Hub) Register(userID string, ch chan Event) *Client {
	h.mu.Lock()
	defer h.mu.Unlock()

	client := &Client{
		UserID:  userID,
		Channel: ch,
	}

	h.clients[userID] = append(h.clients[userID], client)
	return client
}

// Unregister removes a client connection
func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	clients := h.clients[client.UserID]
	for i, c := range clients {
		if c == client {
			// Remove client from slice
			h.clients[client.UserID] = append(clients[:i], clients[i+1:]...)
			break
		}
	}

	// Clean up empty user entries
	if len(h.clients[client.UserID]) == 0 {
		delete(h.clients, client.UserID)
	}

	// Close the channel
	close(client.Channel)
}

// Broadcast sends an event to all connections for a specific user
func (h *Hub) Broadcast(userID string, event Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients := h.clients[userID]
	for _, client := range clients {
		select {
		case client.Channel <- event:
		default:
			// Channel is full or closed, skip
		}
	}
}

// BroadcastNotification sends a notification event to a user with unread count
func (h *Hub) BroadcastNotification(userID string, unreadCount int64) {
	event := Event{
		Type:        "new_notification",
		Timestamp:   time.Now().UnixMilli(),
		UnreadCount: unreadCount,
	}
	h.Broadcast(userID, event)
}

// RegisterTrip subscribes a client to a trip's real-time updates
func (h *Hub) RegisterTrip(userID, tripID string, ch chan TripSyncEvent) *TripClient {
	h.tripMu.Lock()
	defer h.tripMu.Unlock()

	client := &TripClient{
		UserID:  userID,
		TripID:  tripID,
		Channel: ch,
	}

	h.tripClients[tripID] = append(h.tripClients[tripID], client)
	return client
}

// UnregisterTrip removes a client from trip updates
func (h *Hub) UnregisterTrip(client *TripClient) {
	h.tripMu.Lock()
	defer h.tripMu.Unlock()

	clients := h.tripClients[client.TripID]
	for i, c := range clients {
		if c == client {
			h.tripClients[client.TripID] = append(clients[:i], clients[i+1:]...)
			break
		}
	}

	// Clean up empty trip entries
	if len(h.tripClients[client.TripID]) == 0 {
		delete(h.tripClients, client.TripID)
	}

	// Close the channel
	close(client.Channel)
}

// BroadcastTripUpdate sends a trip update event to all clients subscribed to a trip
// excludeUserID can be used to skip sending to the user who made the change
func (h *Hub) BroadcastTripUpdate(tripID, excludeUserID string, event TripSyncEvent) {
	h.tripMu.RLock()
	defer h.tripMu.RUnlock()

	clients := h.tripClients[tripID]
	for _, client := range clients {
		// Skip sending to the user who made the change
		if client.UserID == excludeUserID {
			continue
		}
		select {
		case client.Channel <- event:
		default:
			// Channel is full or closed, skip
		}
	}
}

// GetTripSubscriberCount returns the number of clients subscribed to a trip
func (h *Hub) GetTripSubscriberCount(tripID string) int {
	h.tripMu.RLock()
	defer h.tripMu.RUnlock()

	return len(h.tripClients[tripID])
}

// FormatTripSyncEvent formats a trip sync event for SSE protocol
func FormatTripSyncEvent(event TripSyncEvent) ([]byte, error) {
	data, err := json.Marshal(event)
	if err != nil {
		return nil, err
	}

	result := "event: trip_sync\ndata: " + string(data) + "\n\n"
	return []byte(result), nil
}

// GetConnectedUsers returns list of currently connected user IDs
func (h *Hub) GetConnectedUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]string, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// GetConnectionCount returns total number of connections
func (h *Hub) GetConnectionCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	count := 0
	for _, clients := range h.clients {
		count += len(clients)
	}
	return count
}

// FormatSSEEvent formats an event for SSE protocol
func FormatSSEEvent(eventType string, event Event) ([]byte, error) {
	data, err := json.Marshal(event)
	if err != nil {
		return nil, err
	}

	result := "event: " + eventType + "\ndata: " + string(data) + "\n\n"
	return []byte(result), nil
}
