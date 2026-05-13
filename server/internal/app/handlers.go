package app

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/acgh213/midnight-shift/internal/services"
)

type Handlers struct {
	persistence *services.PersistenceService
	leaderboard *services.LeaderboardService
}

func NewHandlers(p *services.PersistenceService, l *services.LeaderboardService) *Handlers {
	return &Handlers{persistence: p, leaderboard: l}
}

// --- Save/Load ---

func (h *Handlers) HandleSave(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		id = "default"
	}
	crewName := r.URL.Query().Get("crew")
	if crewName == "" {
		crewName = "Midnight Crew"
	}

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

// --- Race Simulation ---

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

// --- Leaderboard ---

func (h *Handlers) HandleLeaderboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50
	offset := 0
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
		offset = o
	}

	entries, err := h.leaderboard.Top(limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []services.LeaderboardEntry{}
	}

	count, _ := h.leaderboard.Count()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"entries": entries,
		"total":   count,
		"limit":   limit,
		"offset":  offset,
	})
}
