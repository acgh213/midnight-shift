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
	dbPath := os.Getenv("MS_DB_PATH")
	if dbPath == "" { dbPath = "midnight-shift.db" }

	database, err := sql.Open("sqlite3", dbPath)
	if err != nil { log.Fatalf("open db: %v", err) }
	defer database.Close()

	if err := db.RunMigrations(database); err != nil {
		log.Fatalf("migrations: %v", err)
	}
	log.Println("migrations complete")

	persistence := services.NewPersistenceService(database)
	leaderboard := services.NewLeaderboardService(database)
	sseHub := services.NewSSEHub()

	r := chi.NewRouter()
	r.Use(app.CORS)

	handlers := app.NewHandlers(persistence, leaderboard, sseHub)
	handlers.RegisterRoutes(r)

	port := os.Getenv("PORT")
	if port == "" { port = "8080" }

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Midnight Shift server starting on %s (SSE active)", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server: %v", err)
	}
}
