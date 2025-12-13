package handlers

import (
	"net/http"
	"strconv"

	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/internal/schemas"
	"backend-go/internal/services"
	"backend-go/pkg/utils"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type ExpenseHandler struct {
	expenseService *services.ExpenseService
	tracer         trace.Tracer
}

func NewExpenseHandler() *ExpenseHandler {
	return &ExpenseHandler{
		expenseService: services.NewExpenseService(),
		tracer:         otel.Tracer("expense-handler"),
	}
}

// RegisterRoutes registers expense routes under /trips/:id
func (h *ExpenseHandler) RegisterRoutes(trips *gin.RouterGroup, clerkSecretKey, clerkJWTIssuerDomain string) {
	// Public routes
	trips.GET("/expenses", h.GetExpensesByTripID)
	trips.GET("/expenses/total", h.GetTotalExpensesByTrip)
	trips.GET("/expenses/category", h.GetExpensesByCategory)
	trips.GET("/expenses/:expenseId", h.GetExpense)

	// Authenticated routes
	authenticated := trips.Group("")
	authenticated.Use(middleware.Auth(clerkSecretKey, clerkJWTIssuerDomain))
	{
		authenticated.POST("/expenses", h.CreateExpense)
		authenticated.PATCH("/expenses/:expenseId", h.UpdateExpense)
		authenticated.DELETE("/expenses/:expenseId", h.DeleteExpense)
		authenticated.POST("/expenses/:expenseId/settle", h.MarkExpenseAsSettled)
	}
}

// GetExpensesByTripID godoc
// @Summary Get expenses by trip ID
// @Tags expenses
// @Param tripId path string true "Trip ID"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {array} models.Expense
// @Router /trips/{tripId}/expenses [get]
func (h *ExpenseHandler) GetExpensesByTripID(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.GetExpensesByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"limit":  limit,
		"offset": offset,
	})

	expenses, err := h.expenseService.GetExpensesByTripID(ctx, tripID, limit, offset)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(expenses),
	})
	c.JSON(http.StatusOK, expenses)
}

// GetExpense godoc
// @Summary Get expense by ID
// @Tags expenses
// @Param id path string true "Expense ID"
// @Success 200 {object} models.Expense
// @Router /expenses/{id} [get]
func (h *ExpenseHandler) GetExpense(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.GetExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	expenseID := c.Param("expenseId")

	logger.Input(map[string]interface{}{
		"expenseID": expenseID,
	})

	expense, err := h.expenseService.GetExpense(ctx, expenseID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusNotFound, gin.H{"error": "expense not found"})
		return
	}

	logger.Output(expense)
	c.JSON(http.StatusOK, expense)
}

// CreateExpense godoc
// @Summary Create a new expense
// @Tags expenses
// @Param tripId path string true "Trip ID"
// @Param expense body schemas.CreateExpenseRequest true "Expense data"
// @Success 201 {object} models.Expense
// @Router /trips/{tripId}/expenses [post]
func (h *ExpenseHandler) CreateExpense(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.CreateExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	var req schemas.CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":      tripID,
		"entryID":     req.EntryID,
		"amount":      req.Amount,
		"currency":    req.Currency,
		"category":    req.Category,
		"description": req.Description,
		"paidBy":      req.PaidBy,
		"splitType":   req.SplitType,
	})

	expense, err := h.expenseService.CreateExpense(
		ctx,
		tripID,
		req.EntryID,
		req.Amount,
		req.Currency,
		models.ExpenseCategory(req.Category),
		req.Description,
		req.PaidBy,
		req.SplitWith,
		req.Date,
		models.SplitType(req.SplitType),
		req.SplitDetails,
	)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"expenseID": expense.ID.Hex(),
	})
	c.JSON(http.StatusCreated, expense)
}

// UpdateExpense godoc
// @Summary Update an expense
// @Tags expenses
// @Param id path string true "Expense ID"
// @Param expense body schemas.UpdateExpenseRequest true "Expense data"
// @Success 200 {object} models.Expense
// @Router /expenses/{id} [patch]
func (h *ExpenseHandler) UpdateExpense(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.UpdateExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	expenseID := c.Param("expenseId")

	var req schemas.UpdateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Input(map[string]interface{}{
		"expenseID": expenseID,
		"request":   req,
	})

	var category *models.ExpenseCategory
	if req.Category != nil {
		cat := models.ExpenseCategory(*req.Category)
		category = &cat
	}

	expense, err := h.expenseService.UpdateExpense(
		ctx,
		expenseID,
		req.Amount,
		req.Currency,
		category,
		req.Description,
		req.Date,
		req.SplitDetails,
	)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Output(expense)
	c.JSON(http.StatusOK, expense)
}

// DeleteExpense godoc
// @Summary Delete an expense
// @Tags expenses
// @Param id path string true "Expense ID"
// @Success 204
// @Router /expenses/{id} [delete]
func (h *ExpenseHandler) DeleteExpense(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.DeleteExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	expenseID := c.Param("expenseId")

	logger.Input(map[string]interface{}{
		"expenseID": expenseID,
	})

	if err := h.expenseService.DeleteExpense(ctx, expenseID); err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Expense deleted successfully")
	c.Status(http.StatusNoContent)
}

// MarkExpenseAsSettled godoc
// @Summary Mark expense as settled
// @Tags expenses
// @Param id path string true "Expense ID"
// @Success 200 {object} gin.H
// @Router /expenses/{id}/settle [post]
func (h *ExpenseHandler) MarkExpenseAsSettled(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.MarkExpenseAsSettled")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	expenseID := c.Param("expenseId")

	logger.Input(map[string]interface{}{
		"expenseID": expenseID,
	})

	if err := h.expenseService.MarkExpenseAsSettled(ctx, expenseID); err != nil {
		logger.Error(err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Expense marked as settled")
	c.JSON(http.StatusOK, gin.H{"message": "expense marked as settled"})
}

// GetTotalExpensesByTrip godoc
// @Summary Get total expenses for a trip
// @Tags expenses
// @Param tripId path string true "Trip ID"
// @Success 200 {object} gin.H
// @Router /trips/{tripId}/expenses/total [get]
func (h *ExpenseHandler) GetTotalExpensesByTrip(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.GetTotalExpensesByTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	total, err := h.expenseService.GetTotalExpensesByTrip(ctx, tripID)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"total": total,
	})
	c.JSON(http.StatusOK, gin.H{"total": total})
}

// GetExpensesByCategory godoc
// @Summary Get expenses by category
// @Tags expenses
// @Param tripId path string true "Trip ID"
// @Param category query string true "Category"
// @Success 200 {array} models.Expense
// @Router /trips/{tripId}/expenses/category [get]
func (h *ExpenseHandler) GetExpensesByCategory(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, span := h.tracer.Start(ctx, "ExpenseHandler.GetExpensesByCategory")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	tripID := c.Param("id")
	category := c.Query("category")

	if category == "" {
		logger.Warn("category is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "category is required"})
		return
	}

	logger.Input(map[string]interface{}{
		"tripID":   tripID,
		"category": category,
	})

	expenses, err := h.expenseService.GetExpensesByCategory(ctx, tripID, category)
	if err != nil {
		logger.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Output(map[string]interface{}{
		"count": len(expenses),
	})
	c.JSON(http.StatusOK, expenses)
}
