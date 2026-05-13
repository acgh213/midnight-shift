package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	_ "github.com/mattn/go-sqlite3"

	"github.com/acgh213/midnight-shift/internal/app"
	"github.com/acgh213/midnight-shift/internal/db"
	"github.com/acgh213/midnight-shift/internal/services"
)

func main() {
	// Database
	dbPath := os.Getenv("MS_DB_PATH")
	if dbPath == "" {
		dbPath = "midnight-shift.db"
	}

	database, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	if err := db.RunMigrations(database); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}
	log.Println("migrations complete")

	// Services
	persistence := services.NewPersistenceService(database)
	leaderboard := services.NewLeaderboardService(database)

	// Router
	r := chi.NewRouter()
	r.Use(app.CORS)

	handlers := app.NewHandlers(persistence, leaderboard)
	handlers.RegisterRoutes(r)

	// Start
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Midnight Shift server starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
