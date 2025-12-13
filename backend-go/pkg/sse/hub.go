package sse

import (
	"encoding/json"
	"sync"
	"time"
)

// Event represents an SSE event to be sent to clients
type Event struct {
	Type      string `json:"type"`
	Timestamp int64  `json:"timestamp"`
}

// Client represents a connected SSE client
type Client struct {
	UserID  string
	Channel chan Event
}

// Hub manages SSE connections for all users
type Hub struct {
	// Map of userID to list of client channels (one user can have multiple connections)
	clients map[string][]*Client
	mu      sync.RWMutex
}

// NewHub creates a new SSE Hub
func NewHub() *Hub {
	return &Hub{
		clients: make(map[string][]*Client),
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

// BroadcastNotification sends a notification event to a user
func (h *Hub) BroadcastNotification(userID string) {
	event := Event{
		Type:      "new_notification",
		Timestamp: time.Now().UnixMilli(),
	}
	h.Broadcast(userID, event)
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
