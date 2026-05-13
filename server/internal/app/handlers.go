package app

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/acgh213/midnight-shift/internal/services"
)

type Handlers struct {
	persistence *services.PersistenceService
	leaderboard *services.LeaderboardService
	sse         *services.SSEHub
}

func NewHandlers(p *services.PersistenceService, l *services.LeaderboardService, sse *services.SSEHub) *Handlers {
	return &Handlers{persistence: p, leaderboard: l, sse: sse}
}

func (h *Handlers) HandleSave(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" { id = "default" }
	crewName := r.URL.Query().Get("crew")
	if crewName == "" { crewName = "Midnight Crew" }

	switch r.Method {
	case http.MethodGet:
		data, err := h.persistence.Load(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if data == nil {
			http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)

	case http.MethodPut:
		var state json.RawMessage
		if err := json.NewDecoder(r.Body).Decode(&state); err != nil {
			http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
			return
		}
		if err := h.persistence.Save(id, crewName, state); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		entries, _ := h.leaderboard.Top(10, 0)
		h.sse.Broadcast(services.SSEEvent{
			Type: services.EventLeaderboardUpdate,
			Data: entries,
		})
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"saved"}`))

	case http.MethodDelete:
		if err := h.persistence.Delete(id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"deleted"}`))

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handlers) HandleRaceSimulate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var input services.SimulateRaceInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"invalid input"}`, http.StatusBadRequest)
		return
	}
	result, err := services.SimulateRace(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *Handlers) HandleLeaderboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	limit := 50
	offset := 0
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 { limit = l }
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 { offset = o }
	entries, err := h.leaderboard.Top(limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if entries == nil { entries = []services.LeaderboardEntry{} }
	count, _ := h.leaderboard.Count()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"entries": entries, "total": count, "limit": limit, "offset": offset,
	})
}

func (h *Handlers) HandleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	client := h.sse.Subscribe()
	defer h.sse.Unsubscribe(client)

	entries, _ := h.leaderboard.Top(10, 0)
	data, _ := json.Marshal(services.SSEEvent{
		Type: services.EventLeaderboardUpdate,
		Data: entries,
	})
	fmt.Fprintf(w, "data: %s\n\n", data)
	flusher.Flush()

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case event, ok := <-client.Events:
			if !ok { return }
			payload, _ := json.Marshal(event)
			fmt.Fprintf(w, "data: %s\n\n", payload)
			flusher.Flush()
		case <-ticker.C:
			fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

type challengeRequest struct {
	ChallengerID   string                       `json:"challengerId"`
	ChallengerName string                       `json:"challengerName"`
	DefenderID     string                       `json:"defenderId"`
	Race           services.RaceSetupInput      `json:"race"`
	Drivers        map[string]services.SimDriver `json:"drivers"`
	Cars           map[string]services.SimCar   `json:"cars"`
	District       services.SimDistrict         `json:"district"`
}

func (h *Handlers) HandleChallenge(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req challengeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid input"}`, http.StatusBadRequest)
		return
	}
	input := services.SimulateRaceInput{
		Race: req.Race, Drivers: req.Drivers, Cars: req.Cars, District: req.District,
	}
	result, err := services.SimulateRace(input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.sse.Broadcast(services.SSEEvent{
		Type: services.EventCrewChallenge,
		Data: map[string]interface{}{
			"challenger": req.ChallengerName,
			"defender":   req.DefenderID,
			"outcome":    result.Outcome,
			"narrative":  result.Narrative,
		},
	})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
