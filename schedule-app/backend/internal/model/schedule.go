package model

import (
	"errors"
	"strings"
	"time"
)

const (
	PriorityLow    = "low"
	PriorityMedium = "medium"
	PriorityHigh   = "high"

	StatusTodo      = "todo"
	StatusDone      = "done"
	StatusCancelled = "cancelled"
)

var (
	ErrTitleRequired     = errors.New("title is required")
	ErrInvalidTimeRange  = errors.New("start time must not be after end time")
	ErrInvalidPriority   = errors.New("priority must be low, medium, or high")
	ErrInvalidStatus     = errors.New("status must be todo, done, or cancelled")
	errStartTimeRequired = errors.New("start time is required")
	errEndTimeRequired   = errors.New("end time is required")
)

type Schedule struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Location    string    `json:"location"`
	Priority    string    `json:"priority"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (s Schedule) Validate() error {
	if strings.TrimSpace(s.Title) == "" {
		return ErrTitleRequired
	}

	if s.StartTime.IsZero() {
		return errStartTimeRequired
	}

	if s.EndTime.IsZero() {
		return errEndTimeRequired
	}

	if s.StartTime.After(s.EndTime) {
		return ErrInvalidTimeRange
	}

	if !IsValidPriority(s.Priority) {
		return ErrInvalidPriority
	}

	if !IsValidStatus(s.Status) {
		return ErrInvalidStatus
	}

	return nil
}

func IsValidPriority(priority string) bool {
	switch priority {
	case PriorityLow, PriorityMedium, PriorityHigh:
		return true
	default:
		return false
	}
}

func IsValidStatus(status string) bool {
	switch status {
	case StatusTodo, StatusDone, StatusCancelled:
		return true
	default:
		return false
	}
}
