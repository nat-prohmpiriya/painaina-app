package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type AdminStatsHandler struct {
	adminService *services.AdminService
	tracer       trace.Tracer
}

func NewAdminStatsHandler(db *mongo.Database) *AdminStatsHandler {
	return &AdminStatsHandler{
		adminService: services.NewAdminService(db),
		tracer:       otel.Tracer("admin-stats-handler"),
	}
}

// GetOverviewStats handles GET /api/v1/admin/stats/overview
// Returns overview statistics for admin dashboard
func (h *AdminStatsHandler) GetOverviewStats(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminStatsHandler.GetOverviewStats")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	stats, err := h.adminService.GetOverviewStats(ctx)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get overview stats: "+err.Error())
		return
	}

	logger.Output(stats)
	Success(c, http.StatusOK, stats)
}

// GetUserGrowthChart handles GET /api/v1/admin/stats/user-growth
// Returns user growth chart data
// Query params: ?months=6 (default 6 months)
func (h *AdminStatsHandler) GetUserGrowthChart(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminStatsHandler.GetUserGrowthChart")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	// Get months parameter (default 6)
	monthsStr := c.DefaultQuery("months", "6")
	months, err := strconv.Atoi(monthsStr)
	if err != nil || months < 1 || months > 24 {
		months = 6
	}

	logger.Input(map[string]interface{}{
		"months": months,
	})

	chartData, err := h.adminService.GetUserGrowthChart(ctx, months)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get user growth chart: "+err.Error())
		return
	}

	logger.Output(chartData)
	Success(c, http.StatusOK, chartData)
}
