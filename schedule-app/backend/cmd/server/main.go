package main

import (
	"log"
	"os"

	"schedule-app/backend/internal/database"
	"schedule-app/backend/internal/handler"
)

func main() {
	dbPath := envOrDefault("DATABASE_DSN", "schedule.db")

	db, err := database.Open(dbPath)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	router := handler.NewRouter(db)

	addr := envOrDefault("SERVER_ADDR", ":8080")
	log.Printf("schedule backend listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
