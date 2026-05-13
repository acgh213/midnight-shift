package app

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (h *Handlers) RegisterRoutes(r chi.Router) {
	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Get("/save", h.HandleSave)
		r.Put("/save", h.HandleSave)
		r.Delete("/save", h.HandleSave)
		r.Post("/race/simulate", h.HandleRaceSimulate)
		r.Get("/leaderboard", h.HandleLeaderboard)
	})

	// Static file serving — serve dist/ in production, proxy in dev
	distPath := findDistDir()
	if distPath != "" {
		fileServer := http.FileServer(http.Dir(distPath))
		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			// Don't intercept API calls
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.NotFound(w, r)
				return
			}
			// Try the exact path, fall back to index.html for SPA routing
			path := filepath.Join(distPath, r.URL.Path)
			if _, err := os.Stat(path); os.IsNotExist(err) {
				http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
				return
			}
			fileServer.ServeHTTP(w, r)
		})
	}
}

func findDistDir() string {
	// Try relative to server binary
	candidates := []string{
		"../dist",       // running from server/cmd/midnight-shift
		"../../dist",    // running from server/
		"./dist",        // running from project root
		"/home/exedev/midnight-shift/dist", // absolute
	}
	for _, p := range candidates {
		if info, err := os.Stat(p); err == nil && info.IsDir() {
			abs, _ := filepath.Abs(p)
			return abs
		}
	}
	return ""
}
