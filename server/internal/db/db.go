package db

import (
	"database/sql"
	"embed"
	"fmt"
	"sort"
	"strings"
	"time"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func RunMigrations(database *sql.DB) error {
	_, err := database.Exec(`
		CREATE TABLE IF NOT EXISTS _migrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			applied_at TEXT NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("creating migrations table: %w", err)
	}

	applied := make(map[string]bool)
	rows, err := database.Query("SELECT name FROM _migrations")
	if err != nil {
		return fmt.Errorf("querying migrations: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var name string
		rows.Scan(&name)
		applied[name] = true
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("reading migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, file := range files {
		if applied[file] {
			continue
		}
		content, err := migrationsFS.ReadFile("migrations/" + file)
		if err != nil {
			return fmt.Errorf("reading migration %s: %w", file, err)
		}

		for _, stmt := range splitSQL(string(content)) {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if _, err := database.Exec(stmt); err != nil {
				return fmt.Errorf("executing migration %s: %w", file, err)
			}
		}

		_, err = database.Exec(
			"INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
			file, time.Now().UTC().Format(time.RFC3339),
		)
		if err != nil {
			return fmt.Errorf("recording migration %s: %w", file, err)
		}
		fmt.Printf("applied migration: %s\n", file)
	}

	return nil
}

func splitSQL(sql string) []string {
	var statements []string
	current := ""
	for _, line := range strings.Split(sql, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}
		current += trimmed + "\n"
		if strings.HasSuffix(trimmed, ";") {
			statements = append(statements, strings.TrimSuffix(current, "\n"))
			current = ""
		}
	}
	if strings.TrimSpace(current) != "" {
		statements = append(statements, strings.TrimSpace(current))
	}
	return statements
}
