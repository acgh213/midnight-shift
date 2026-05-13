package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type PersistenceService struct {
	db *sql.DB
}

func NewPersistenceService(database *sql.DB) *PersistenceService {
	return &PersistenceService{db: database}
}

func (s *PersistenceService) Save(id string, crewName string, stateJSON []byte) error {
	now := time.Now().UTC().Format(time.RFC3339)

	// Extract rep/night/prestige from state for leaderboard
	var state gameStateSummary
	if err := json.Unmarshal(stateJSON, &state); err == nil {
		_, err := s.db.Exec(`
			INSERT INTO leaderboard (id, crew_name, rep, night, prestige, wins, losses, signature_driver, last_active)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				crew_name = excluded.crew_name,
				rep = excluded.rep,
				night = excluded.night,
				prestige = excluded.prestige,
				wins = excluded.wins,
				losses = excluded.losses,
				signature_driver = excluded.signature_driver,
				last_active = excluded.last_active
		`, id, crewName, state.Rep, state.Night, state.Prestige, state.Wins, state.Losses, state.SignatureDriver, now)
		if err != nil {
			fmt.Printf("leaderboard update failed (non-fatal): %v\n", err)
		}
	}

	_, err := s.db.Exec(`
		INSERT INTO saves (id, crew_name, night, prestige, state_json, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			crew_name = excluded.crew_name,
			night = excluded.night,
			prestige = excluded.prestige,
			state_json = excluded.state_json,
			updated_at = excluded.updated_at
	`, id, crewName, state.Night, state.Prestige, string(stateJSON), now, now)
	if err != nil {
		return fmt.Errorf("saving game: %w", err)
	}
	return nil
}

func (s *PersistenceService) Load(id string) ([]byte, error) {
	var stateJSON string
	err := s.db.QueryRow("SELECT state_json FROM saves WHERE id = ?", id).Scan(&stateJSON)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("loading game: %w", err)
	}
	return []byte(stateJSON), nil
}

func (s *PersistenceService) Delete(id string) error {
	_, err := s.db.Exec("DELETE FROM saves WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting save: %w", err)
	}
	_, _ = s.db.Exec("DELETE FROM leaderboard WHERE id = ?", id)
	return nil
}

// gameStateSummary — minimal extraction from the JSON blob for leaderboard
type gameStateSummary struct {
	Night           int    `json:"night"`
	Rep             int    `json:"rep"`
	Prestige        int    `json:"prestige"`
	Wins            int    `json:"wins"`
	Losses          int    `json:"losses"`
	SignatureDriver string `json:"signatureDriver"`
}

// Extract summary from JSON blob (partial unmarshal)
func (s *gameStateSummary) UnmarshalJSON(data []byte) error {
	// We only need a few fields; extract them from the economy + counts
	type raw struct {
		Night    int `json:"night"`
		Economy  struct {
			Rep int `json:"rep"`
		} `json:"economy"`
		PrestigeCarryover struct {
			SignatureDriverKept string `json:"signatureDriverKept"`
		} `json:"prestigeCarryover"`
		RaceResults map[string]struct {
			Outcome string `json:"outcome"`
		} `json:"raceResults"`
	}
	var r raw
	if err := json.Unmarshal(data, &r); err != nil {
		return err
	}
	s.Night = r.Night
	s.Rep = r.Economy.Rep
	s.SignatureDriver = r.PrestigeCarryover.SignatureDriverKept

	// Count wins/losses from race results
	wins := 0
	losses := 0
	for _, rr := range r.RaceResults {
		switch rr.Outcome {
		case "win":
			wins++
		case "loss":
			losses++
		}
	}
	s.Wins = wins
	s.Losses = losses

	// Prestige: count how many times night > some threshold? Use night as proxy
	// Real prestige tracking should be added to GameState eventually
	s.Prestige = 0
	return nil
}
