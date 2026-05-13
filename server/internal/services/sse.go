package services

import (
	"fmt"
	"log"
	"sync"
)

// Event types broadcast over SSE
const (
	EventLeaderboardUpdate = "leaderboard_update"
	EventCrewChallenge     = "crew_challenge"
	EventNightChange       = "night_change"
)

type SSEEvent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type SSEClient struct {
	ID     string
	Events chan SSEEvent
}

type SSEHub struct {
	mu      sync.RWMutex
	clients map[string]*SSEClient
	counter int
}

func NewSSEHub() *SSEHub {
	return &SSEHub{
		clients: make(map[string]*SSEClient),
	}
}

func (h *SSEHub) Subscribe() *SSEClient {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.counter++
	id := fmt.Sprintf("client-%d", h.counter)
	client := &SSEClient{
		ID:     id,
		Events: make(chan SSEEvent, 32),
	}
	h.clients[id] = client
	log.Printf("SSE client connected: %s (total: %d)", id, len(h.clients))
	return client
}

func (h *SSEHub) Unsubscribe(client *SSEClient) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.clients, client.ID)
	close(client.Events)
	log.Printf("SSE client disconnected: %s (total: %d)", client.ID, len(h.clients))
}

func (h *SSEHub) Broadcast(event SSEEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		select {
		case client.Events <- event:
		default:
			// Client buffer full, drop
		}
	}
}

func (h *SSEHub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
