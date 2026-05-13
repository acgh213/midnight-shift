package services

import (
	"database/sql"
	"fmt"
)

type LeaderboardEntry struct {
	ID               string `json:"id"`
	CrewName         string `json:"crewName"`
	Rep              int    `json:"rep"`
	Night            int    `json:"night"`
	Prestige         int    `json:"prestige"`
	Wins             int    `json:"wins"`
	Losses           int    `json:"losses"`
	SignatureDriver  string `json:"signatureDriver"`
	LastActive       string `json:"lastActive"`
}

type LeaderboardService struct {
	db *sql.DB
}

func NewLeaderboardService(database *sql.DB) *LeaderboardService {
	return &LeaderboardService{db: database}
}

func (s *LeaderboardService) Top(limit int, offset int) ([]LeaderboardEntry, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}

	rows, err := s.db.Query(`
		SELECT id, crew_name, rep, night, prestige, wins, losses, signature_driver, last_active
		FROM leaderboard
		ORDER BY rep DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("querying leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	for rows.Next() {
		var e LeaderboardEntry
		if err := rows.Scan(&e.ID, &e.CrewName, &e.Rep, &e.Night, &e.Prestige, &e.Wins, &e.Losses, &e.SignatureDriver, &e.LastActive); err != nil {
			return nil, fmt.Errorf("scanning leaderboard row: %w", err)
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func (s *LeaderboardService) Count() (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM leaderboard").Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting leaderboard: %w", err)
	}
	return count, nil
}
