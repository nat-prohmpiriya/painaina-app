package handlers

import (
	"log"
	"net/http"
	"time"

	"backend-go/pkg/sse"

	"github.com/gin-gonic/gin"
)

type SSEHandler struct {
	hub *sse.Hub
}

func NewSSEHandler(hub *sse.Hub) *SSEHandler {
	return &SSEHandler{
		hub: hub,
	}
}

// StreamNotifications handles SSE connections for notification streaming
// @Summary Stream notifications via SSE
// @Description Establish an SSE connection to receive real-time notification events
// @Tags sse
// @Produce text/event-stream
// @Success 200 {string} string "SSE stream"
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/sse/notifications [get]
func (h *SSEHandler) StreamNotifications(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")
	c.Header("X-Accel-Buffering", "no") // Disable nginx buffering

	// Create client channel
	clientChan := make(chan sse.Event, 10)
	client := h.hub.Register(userID.(string), clientChan)

	log.Printf("SSE: Client connected for user %s", userID.(string))

	// Cleanup on disconnect
	defer func() {
		h.hub.Unregister(client)
		log.Printf("SSE: Client disconnected for user %s", userID.(string))
	}()

	// Send initial connection event
	initialEvent := sse.Event{
		Type:      "connected",
		Timestamp: time.Now().UnixMilli(),
	}
	if data, err := sse.FormatSSEEvent("connection", initialEvent); err == nil {
		c.Writer.Write(data)
		c.Writer.Flush()
	}

	// Heartbeat ticker (every 30 seconds)
	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	// Stream events
	clientGone := c.Request.Context().Done()
	for {
		select {
		case <-clientGone:
			// Client disconnected
			return
		case event := <-clientChan:
			// Send notification event
			if data, err := sse.FormatSSEEvent("notification", event); err == nil {
				_, writeErr := c.Writer.Write(data)
				if writeErr != nil {
					return
				}
				c.Writer.Flush()
			}
		case <-heartbeat.C:
			// Send heartbeat to keep connection alive
			heartbeatEvent := sse.Event{
				Type:      "ping",
				Timestamp: time.Now().UnixMilli(),
			}
			if data, err := sse.FormatSSEEvent("heartbeat", heartbeatEvent); err == nil {
				_, writeErr := c.Writer.Write(data)
				if writeErr != nil {
					return
				}
				c.Writer.Flush()
			}
		}
	}
}

// GetSSEStats returns SSE connection statistics (admin only)
func (h *SSEHandler) GetSSEStats(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"connectedUsers":  h.hub.GetConnectedUsers(),
		"connectionCount": h.hub.GetConnectionCount(),
	})
}
