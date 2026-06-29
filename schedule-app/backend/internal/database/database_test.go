package database

import (
	"testing"
	"time"

	"schedule-app/backend/internal/model"
)

func TestOpenAutoMigratesScheduleTable(t *testing.T) {
	db, err := Open("file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}

	if !db.Migrator().HasTable(&model.Schedule{}) {
		t.Fatal("expected schedules table to be migrated")
	}

	schedule := model.Schedule{
		Title:     "Team sync",
		StartTime: time.Date(2026, 7, 1, 9, 0, 0, 0, time.UTC),
		EndTime:   time.Date(2026, 7, 1, 10, 0, 0, 0, time.UTC),
		Priority:  model.PriorityMedium,
		Status:    model.StatusTodo,
	}

	if err := db.Create(&schedule).Error; err != nil {
		t.Fatalf("create schedule error = %v", err)
	}

	if schedule.ID == 0 {
		t.Fatal("expected created schedule to have an ID")
	}
}
