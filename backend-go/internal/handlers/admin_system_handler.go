package handlers

import (
	"net/http"

	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type AdminSystemHandler struct {
	adminService *services.AdminService
	tracer       trace.Tracer
}

func NewAdminSystemHandler(db *mongo.Database) *AdminSystemHandler {
	return &AdminSystemHandler{
		adminService: services.NewAdminService(db),
		tracer:       otel.Tracer("admin-system-handler"),
	}
}

// GetSystemHealth handles GET /api/v1/admin/system/health
// Returns system health status
func (h *AdminSystemHandler) GetSystemHealth(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "AdminSystemHandler.GetSystemHealth")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	health, err := h.adminService.GetSystemHealth(ctx)
	if err != nil {
		logger.Error(err)
		InternalServerError(c, "Failed to get system health: "+err.Error())
		return
	}

	logger.Output(health)
	Success(c, http.StatusOK, health)
}
