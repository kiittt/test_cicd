package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"schedule-app/backend/internal/database"
	"schedule-app/backend/internal/model"

	"github.com/gin-gonic/gin"
)

func TestHealth(t *testing.T) {
	router := newTestRouter(t)

	response := performRequest(router, http.MethodGet, "/health", nil)

	assertStatus(t, response, http.StatusOK)
	assertJSONField(t, response, "status", "ok")
}

func TestCreateScheduleSuccess(t *testing.T) {
	router := newTestRouter(t)

	response := createSchedule(t, router, schedulePayload{
		Title:       "Team sync",
		Description: "Weekly planning",
		StartTime:   "2026-07-01T09:00:00Z",
		EndTime:     "2026-07-01T10:00:00Z",
		Location:    "Meeting room A",
		Priority:    model.PriorityMedium,
		Status:      model.StatusTodo,
	})

	assertStatus(t, response, http.StatusCreated)

	var schedule model.Schedule
	decodeJSON(t, response, &schedule)
	if schedule.ID == 0 {
		t.Fatal("expected created schedule to have an ID")
	}
	if schedule.Title != "Team sync" {
		t.Fatalf("expected title Team sync, got %q", schedule.Title)
	}
}

func TestCreateScheduleValidationErrors(t *testing.T) {
	tests := []struct {
		name        string
		payload     schedulePayload
		wantMessage string
	}{
		{
			name: "title is required",
			payload: schedulePayload{
				Title:     " ",
				StartTime: "2026-07-01T09:00:00Z",
				EndTime:   "2026-07-01T10:00:00Z",
				Priority:  model.PriorityMedium,
				Status:    model.StatusTodo,
			},
			wantMessage: model.ErrTitleRequired.Error(),
		},
		{
			name: "start time must not be after end time",
			payload: schedulePayload{
				Title:     "Team sync",
				StartTime: "2026-07-01T11:00:00Z",
				EndTime:   "2026-07-01T10:00:00Z",
				Priority:  model.PriorityMedium,
				Status:    model.StatusTodo,
			},
			wantMessage: model.ErrInvalidTimeRange.Error(),
		},
		{
			name: "priority must be valid",
			payload: schedulePayload{
				Title:     "Team sync",
				StartTime: "2026-07-01T09:00:00Z",
				EndTime:   "2026-07-01T10:00:00Z",
				Priority:  "urgent",
				Status:    model.StatusTodo,
			},
			wantMessage: model.ErrInvalidPriority.Error(),
		},
		{
			name: "status must be valid",
			payload: schedulePayload{
				Title:     "Team sync",
				StartTime: "2026-07-01T09:00:00Z",
				EndTime:   "2026-07-01T10:00:00Z",
				Priority:  model.PriorityMedium,
				Status:    "doing",
			},
			wantMessage: model.ErrInvalidStatus.Error(),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := newTestRouter(t)
			response := performRequest(router, http.MethodPost, "/api/schedules", tt.payload)

			assertStatus(t, response, http.StatusBadRequest)
			assertJSONField(t, response, "message", tt.wantMessage)
		})
	}
}

func TestListSchedulesWithFilters(t *testing.T) {
	router := newTestRouter(t)
	createSchedule(t, router, schedulePayload{
		Title:       "Design meeting",
		Description: "Discuss checkout page",
		StartTime:   "2026-07-01T09:00:00Z",
		EndTime:     "2026-07-01T10:00:00Z",
		Priority:    model.PriorityHigh,
		Status:      model.StatusTodo,
	})
	createSchedule(t, router, schedulePayload{
		Title:       "Gym",
		Description: "Evening workout",
		StartTime:   "2026-07-02T19:00:00Z",
		EndTime:     "2026-07-02T20:00:00Z",
		Priority:    model.PriorityLow,
		Status:      model.StatusDone,
	})

	tests := []struct {
		name      string
		path      string
		wantCount int
		wantTitle string
	}{
		{
			name:      "list all",
			path:      "/api/schedules",
			wantCount: 2,
		},
		{
			name:      "keyword filters title or description",
			path:      "/api/schedules?keyword=checkout",
			wantCount: 1,
			wantTitle: "Design meeting",
		},
		{
			name:      "status filters schedules",
			path:      "/api/schedules?status=done",
			wantCount: 1,
			wantTitle: "Gym",
		},
		{
			name:      "date filters schedules",
			path:      "/api/schedules?date=2026-07-01",
			wantCount: 1,
			wantTitle: "Design meeting",
		},
		{
			name:      "empty result returns empty list",
			path:      "/api/schedules?keyword=missing",
			wantCount: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			response := performRequest(router, http.MethodGet, tt.path, nil)
			assertStatus(t, response, http.StatusOK)

			var schedules []model.Schedule
			decodeJSON(t, response, &schedules)
			if len(schedules) != tt.wantCount {
				t.Fatalf("expected %d schedules, got %d", tt.wantCount, len(schedules))
			}
			if tt.wantTitle != "" && schedules[0].Title != tt.wantTitle {
				t.Fatalf("expected title %q, got %q", tt.wantTitle, schedules[0].Title)
			}
		})
	}
}

func TestListSchedulesRejectsInvalidFilters(t *testing.T) {
	router := newTestRouter(t)

	tests := []struct {
		path        string
		wantMessage string
	}{
		{
			path:        "/api/schedules?status=doing",
			wantMessage: model.ErrInvalidStatus.Error(),
		},
		{
			path:        "/api/schedules?date=07-01-2026",
			wantMessage: "date must use YYYY-MM-DD",
		},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			response := performRequest(router, http.MethodGet, tt.path, nil)
			assertStatus(t, response, http.StatusBadRequest)
			assertJSONField(t, response, "message", tt.wantMessage)
		})
	}
}

func TestGetSchedule(t *testing.T) {
	router := newTestRouter(t)
	created := decodeSchedule(t, createSchedule(t, router, schedulePayload{
		Title:     "Team sync",
		StartTime: "2026-07-01T09:00:00Z",
		EndTime:   "2026-07-01T10:00:00Z",
		Priority:  model.PriorityMedium,
		Status:    model.StatusTodo,
	}))

	response := performRequest(router, http.MethodGet, fmt.Sprintf("/api/schedules/%d", created.ID), nil)

	assertStatus(t, response, http.StatusOK)
	got := decodeSchedule(t, response)
	if got.ID != created.ID || got.Title != created.Title {
		t.Fatalf("expected schedule %#v, got %#v", created, got)
	}
}

func TestGetScheduleNotFound(t *testing.T) {
	router := newTestRouter(t)

	response := performRequest(router, http.MethodGet, "/api/schedules/999", nil)

	assertStatus(t, response, http.StatusNotFound)
	assertJSONField(t, response, "message", "schedule not found")
}

func TestUpdateSchedule(t *testing.T) {
	router := newTestRouter(t)
	created := decodeSchedule(t, createSchedule(t, router, schedulePayload{
		Title:     "Team sync",
		StartTime: "2026-07-01T09:00:00Z",
		EndTime:   "2026-07-01T10:00:00Z",
		Priority:  model.PriorityMedium,
		Status:    model.StatusTodo,
	}))

	response := performRequest(router, http.MethodPut, fmt.Sprintf("/api/schedules/%d", created.ID), schedulePayload{
		Title:       "Updated sync",
		Description: "Updated notes",
		StartTime:   "2026-07-01T11:00:00Z",
		EndTime:     "2026-07-01T12:00:00Z",
		Location:    "Room B",
		Priority:    model.PriorityHigh,
		Status:      model.StatusDone,
	})

	assertStatus(t, response, http.StatusOK)
	updated := decodeSchedule(t, response)
	if updated.ID != created.ID {
		t.Fatalf("expected ID %d, got %d", created.ID, updated.ID)
	}
	if updated.Title != "Updated sync" || updated.Status != model.StatusDone {
		t.Fatalf("unexpected updated schedule: %#v", updated)
	}
}

func TestUpdateScheduleNotFound(t *testing.T) {
	router := newTestRouter(t)

	response := performRequest(router, http.MethodPut, "/api/schedules/999", schedulePayload{
		Title:     "Updated sync",
		StartTime: "2026-07-01T11:00:00Z",
		EndTime:   "2026-07-01T12:00:00Z",
		Priority:  model.PriorityHigh,
		Status:    model.StatusDone,
	})

	assertStatus(t, response, http.StatusNotFound)
	assertJSONField(t, response, "message", "schedule not found")
}

func TestDeleteSchedule(t *testing.T) {
	router := newTestRouter(t)
	created := decodeSchedule(t, createSchedule(t, router, schedulePayload{
		Title:     "Team sync",
		StartTime: "2026-07-01T09:00:00Z",
		EndTime:   "2026-07-01T10:00:00Z",
		Priority:  model.PriorityMedium,
		Status:    model.StatusTodo,
	}))

	deleteResponse := performRequest(router, http.MethodDelete, fmt.Sprintf("/api/schedules/%d", created.ID), nil)
	assertStatus(t, deleteResponse, http.StatusNoContent)

	getResponse := performRequest(router, http.MethodGet, fmt.Sprintf("/api/schedules/%d", created.ID), nil)
	assertStatus(t, getResponse, http.StatusNotFound)
}

func TestDeleteScheduleNotFound(t *testing.T) {
	router := newTestRouter(t)

	response := performRequest(router, http.MethodDelete, "/api/schedules/999", nil)

	assertStatus(t, response, http.StatusNotFound)
	assertJSONField(t, response, "message", "schedule not found")
}

func TestInvalidID(t *testing.T) {
	router := newTestRouter(t)

	response := performRequest(router, http.MethodGet, "/api/schedules/not-a-number", nil)

	assertStatus(t, response, http.StatusBadRequest)
	assertJSONField(t, response, "message", "id must be a positive integer")
}

func TestCORSPreflight(t *testing.T) {
	router := newTestRouter(t)

	response := performRequest(router, http.MethodOptions, "/api/schedules", nil)

	assertStatus(t, response, http.StatusNoContent)
	if got := response.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("expected CORS origin *, got %q", got)
	}
}

type schedulePayload struct {
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	StartTime   string `json:"startTime"`
	EndTime     string `json:"endTime"`
	Location    string `json:"location,omitempty"`
	Priority    string `json:"priority"`
	Status      string `json:"status"`
}

func newTestRouter(t *testing.T) *gin.Engine {
	t.Helper()

	gin.SetMode(gin.TestMode)

	db, err := database.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_")))
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}

	return NewRouter(db)
}

func createSchedule(t *testing.T, router http.Handler, payload schedulePayload) *httptest.ResponseRecorder {
	t.Helper()

	response := performRequest(router, http.MethodPost, "/api/schedules", payload)
	if response.Code != http.StatusCreated {
		t.Fatalf("create schedule failed with status %d and body %q", response.Code, response.Body.String())
	}

	return response
}

func performRequest(router http.Handler, method, path string, payload any) *httptest.ResponseRecorder {
	var body *bytes.Reader
	if payload == nil {
		body = bytes.NewReader(nil)
	} else {
		raw, err := json.Marshal(payload)
		if err != nil {
			panic(err)
		}
		body = bytes.NewReader(raw)
	}

	request := httptest.NewRequest(method, path, body)
	request.Header.Set("Content-Type", "application/json")

	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	return response
}

func decodeSchedule(t *testing.T, response *httptest.ResponseRecorder) model.Schedule {
	t.Helper()

	var schedule model.Schedule
	decodeJSON(t, response, &schedule)
	return schedule
}

func decodeJSON(t *testing.T, response *httptest.ResponseRecorder, target any) {
	t.Helper()

	if err := json.Unmarshal(response.Body.Bytes(), target); err != nil {
		t.Fatalf("decode response body %q: %v", response.Body.String(), err)
	}
}

func assertStatus(t *testing.T, response *httptest.ResponseRecorder, want int) {
	t.Helper()

	if response.Code != want {
		t.Fatalf("expected status %d, got %d with body %q", want, response.Code, response.Body.String())
	}
}

func assertJSONField(t *testing.T, response *httptest.ResponseRecorder, field, want string) {
	t.Helper()

	var body map[string]string
	decodeJSON(t, response, &body)
	if got := body[field]; got != want {
		t.Fatalf("expected %s %q, got %q", field, want, got)
	}
}
