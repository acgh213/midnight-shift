package app

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (h *Handlers) RegisterRoutes(r chi.Router) {
	r.Route("/api", func(r chi.Router) {
		r.Get("/save", h.HandleSave)
		r.Put("/save", h.HandleSave)
		r.Delete("/save", h.HandleSave)
		r.Post("/race/simulate", h.HandleRaceSimulate)
		r.Get("/leaderboard", h.HandleLeaderboard)
		r.Get("/events", h.HandleSSE)
		r.Post("/challenge", h.HandleChallenge)
	})

	distPath := findDistDir()
	if distPath != "" {
		fs := http.FileServer(http.Dir(distPath))
		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.NotFound(w, r)
				return
			}
			p := filepath.Join(distPath, r.URL.Path)
			if _, err := os.Stat(p); os.IsNotExist(err) {
				http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
				return
			}
			fs.ServeHTTP(w, r)
		})
	}
}

func findDistDir() string {
	for _, p := range []string{"../dist", "../../dist", "./dist", "/home/exedev/midnight-shift/dist"} {
		if info, err := os.Stat(p); err == nil && info.IsDir() {
			abs, _ := filepath.Abs(p)
			return abs
		}
	}
	return ""
}
