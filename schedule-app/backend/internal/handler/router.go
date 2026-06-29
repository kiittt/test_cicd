package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"schedule-app/backend/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const dateLayout = "2006-01-02"

type scheduleRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Location    string    `json:"location"`
	Priority    string    `json:"priority"`
	Status      string    `json:"status"`
}

type scheduleHandler struct {
	db *gorm.DB
}

func NewRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()
	if err := router.SetTrustedProxies(nil); err != nil {
		panic(fmt.Sprintf("configure trusted proxies: %v", err))
	}

	RegisterRoutes(router, db)
	return router
}

func RegisterRoutes(router *gin.Engine, db *gorm.DB) {
	router.Use(corsMiddleware())

	h := scheduleHandler{db: db}
	router.GET("/health", h.health)

	api := router.Group("/api")
	api.GET("/schedules", h.listSchedules)
	api.GET("/schedules/:id", h.getSchedule)
	api.POST("/schedules", h.createSchedule)
	api.PUT("/schedules/:id", h.updateSchedule)
	api.DELETE("/schedules/:id", h.deleteSchedule)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}

		c.Next()
	}
}

func (h scheduleHandler) health(c *gin.Context) {
	sqlDB, err := h.db.DB()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "database is unavailable")
		return
	}

	if err := sqlDB.Ping(); err != nil {
		respondError(c, http.StatusInternalServerError, "database is unavailable")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h scheduleHandler) listSchedules(c *gin.Context) {
	query := h.db.Model(&model.Schedule{}).Order("start_time asc, id asc")

	if keyword := strings.TrimSpace(c.Query("keyword")); keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("title LIKE ? OR description LIKE ?", like, like)
	}

	if status := strings.TrimSpace(c.Query("status")); status != "" {
		if !model.IsValidStatus(status) {
			respondError(c, http.StatusBadRequest, model.ErrInvalidStatus.Error())
			return
		}
		query = query.Where("status = ?", status)
	}

	if date := strings.TrimSpace(c.Query("date")); date != "" {
		day, err := time.Parse(dateLayout, date)
		if err != nil {
			respondError(c, http.StatusBadRequest, "date must use YYYY-MM-DD")
			return
		}
		query = query.Where("start_time >= ? AND start_time < ?", day, day.AddDate(0, 0, 1))
	}

	var schedules []model.Schedule
	if err := query.Find(&schedules).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "failed to list schedules")
		return
	}

	c.JSON(http.StatusOK, schedules)
}

func (h scheduleHandler) getSchedule(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	schedule, ok := h.findSchedule(c, id)
	if !ok {
		return
	}

	c.JSON(http.StatusOK, schedule)
}

func (h scheduleHandler) createSchedule(c *gin.Context) {
	schedule, ok := bindSchedule(c)
	if !ok {
		return
	}

	if err := h.db.Create(&schedule).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "failed to create schedule")
		return
	}

	c.JSON(http.StatusCreated, schedule)
}

func (h scheduleHandler) updateSchedule(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	existing, ok := h.findSchedule(c, id)
	if !ok {
		return
	}

	next, ok := bindSchedule(c)
	if !ok {
		return
	}

	existing.Title = next.Title
	existing.Description = next.Description
	existing.StartTime = next.StartTime
	existing.EndTime = next.EndTime
	existing.Location = next.Location
	existing.Priority = next.Priority
	existing.Status = next.Status

	if err := h.db.Save(&existing).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "failed to update schedule")
		return
	}

	c.JSON(http.StatusOK, existing)
}

func (h scheduleHandler) deleteSchedule(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	schedule, ok := h.findSchedule(c, id)
	if !ok {
		return
	}

	if err := h.db.Delete(&schedule).Error; err != nil {
		respondError(c, http.StatusInternalServerError, "failed to delete schedule")
		return
	}

	c.Status(http.StatusNoContent)
}

func (h scheduleHandler) findSchedule(c *gin.Context, id uint) (model.Schedule, bool) {
	var schedule model.Schedule
	if err := h.db.First(&schedule, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "schedule not found")
			return model.Schedule{}, false
		}

		respondError(c, http.StatusInternalServerError, "failed to get schedule")
		return model.Schedule{}, false
	}

	return schedule, true
}

func bindSchedule(c *gin.Context) (model.Schedule, bool) {
	var request scheduleRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		respondError(c, http.StatusBadRequest, "invalid request body")
		return model.Schedule{}, false
	}

	schedule := model.Schedule{
		Title:       request.Title,
		Description: request.Description,
		StartTime:   request.StartTime,
		EndTime:     request.EndTime,
		Location:    request.Location,
		Priority:    request.Priority,
		Status:      request.Status,
	}

	if err := schedule.Validate(); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return model.Schedule{}, false
	}

	return schedule, true
}

func parseID(c *gin.Context) (uint, bool) {
	raw := c.Param("id")
	id, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || id == 0 {
		respondError(c, http.StatusBadRequest, "id must be a positive integer")
		return 0, false
	}

	return uint(id), true
}

func respondError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"message": message})
}
