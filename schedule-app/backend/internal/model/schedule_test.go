package model

import (
	"errors"
	"testing"
	"time"
)

func TestScheduleValidate(t *testing.T) {
	start := time.Date(2026, 7, 1, 9, 0, 0, 0, time.UTC)
	end := time.Date(2026, 7, 1, 10, 0, 0, 0, time.UTC)

	tests := []struct {
		name     string
		schedule Schedule
		wantErr  error
	}{
		{
			name: "valid schedule",
			schedule: Schedule{
				Title:     "Team sync",
				StartTime: start,
				EndTime:   end,
				Priority:  PriorityMedium,
				Status:    StatusTodo,
			},
		},
		{
			name: "title is required",
			schedule: Schedule{
				Title:     " ",
				StartTime: start,
				EndTime:   end,
				Priority:  PriorityMedium,
				Status:    StatusTodo,
			},
			wantErr: ErrTitleRequired,
		},
		{
			name: "start time must not be after end time",
			schedule: Schedule{
				Title:     "Team sync",
				StartTime: end,
				EndTime:   start,
				Priority:  PriorityMedium,
				Status:    StatusTodo,
			},
			wantErr: ErrInvalidTimeRange,
		},
		{
			name: "priority must be valid",
			schedule: Schedule{
				Title:     "Team sync",
				StartTime: start,
				EndTime:   end,
				Priority:  "urgent",
				Status:    StatusTodo,
			},
			wantErr: ErrInvalidPriority,
		},
		{
			name: "status must be valid",
			schedule: Schedule{
				Title:     "Team sync",
				StartTime: start,
				EndTime:   end,
				Priority:  PriorityMedium,
				Status:    "doing",
			},
			wantErr: ErrInvalidStatus,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.schedule.Validate()
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Validate() error = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestIsValidPriority(t *testing.T) {
	for _, priority := range []string{PriorityLow, PriorityMedium, PriorityHigh} {
		if !IsValidPriority(priority) {
			t.Fatalf("expected %q to be valid", priority)
		}
	}

	if IsValidPriority("urgent") {
		t.Fatal("expected urgent to be invalid")
	}
}

func TestIsValidStatus(t *testing.T) {
	for _, status := range []string{StatusTodo, StatusDone, StatusCancelled} {
		if !IsValidStatus(status) {
			t.Fatalf("expected %q to be valid", status)
		}
	}

	if IsValidStatus("doing") {
		t.Fatal("expected doing to be invalid")
	}
}
