package services

import (
	"context"
	"errors"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/pkg/utils"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type ExpenseService struct {
	expenseRepo *repository.ExpenseRepository
	tracer      trace.Tracer
}

func NewExpenseService() *ExpenseService {
	return &ExpenseService{
		expenseRepo: repository.NewExpenseRepository(),
		tracer:      otel.Tracer("expense-service"),
	}
}

// GetExpensesByTripID gets all expenses for a trip
func (s *ExpenseService) GetExpensesByTripID(ctx context.Context, tripID string, limit, offset int) ([]*models.Expense, error) {
	ctx, span := s.tracer.Start(ctx, "ExpenseService.GetExpensesByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"limit":  limit,
		"offset": offset,
	})

	expenses, err := s.expenseRepo.FindByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(expenses),
	})
	return expenses, nil
}

// GetExpense gets an expense by ID
func (s *ExpenseService) GetExpense(ctx context.Context, expenseID string) (*models.Expense, error) {
	ctx, span := s.tracer.Start(ctx, "ExpenseService.GetExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"expenseID": expenseID,
	})

	expense, err := s.expenseRepo.FindByID(ctx, expenseID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(expense)
	return expense, nil
}

// CreateExpense creates a new expense
func (s *ExpenseService) CreateExpense(
	ctx context.Context,
	tripID string,
	entryID *string,
	amount float64,
	currency string,
	category models.ExpenseCategory,
	description string,
	paidBy string,
	splitWith []string,
	date time.Time,
	splitType models.SplitType,
	splitDetails []models.SplitDetail,
) (*models.Expense, error) {
	ctx, span := s.tracer.Start(ctx, "ExpenseService.CreateExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":      tripID,
		"amount":      amount,
		"category":    category,
		"description": description,
	})

	// Use repository helper to create expense with ObjectIDs
	expense, err := s.expenseRepo.NewExpense(tripID, paidBy, splitWith)
	if err != nil {
		err := errors.New("invalid IDs")
		logger.Error(err)
		return nil, err
	}

	// Set other fields
	expense.Amount = amount
	expense.Currency = currency
	expense.Category = category
	expense.Description = description
	expense.Date = date
	expense.SplitType = splitType
	expense.SplitDetails = splitDetails
	expense.Status = models.ExpenseStatusPending

	// Set optional EntryID if provided
	if entryID != nil && *entryID != "" {
		if err := s.expenseRepo.SetEntryID(expense, *entryID); err != nil {
			err := errors.New("invalid entry ID")
			logger.Error(err)
			return nil, err
		}
	}

	if err := s.expenseRepo.Create(ctx, expense); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"expenseID": expense.ID.Hex(),
	})
	return expense, nil
}

// UpdateExpense updates an expense
func (s *ExpenseService) UpdateExpense(
	ctx context.Context,
	expenseID string,
	amount *float64,
	currency *string,
	category *models.ExpenseCategory,
	description *string,
	date *time.Time,
	splitDetails *[]models.SplitDetail,
) (*models.Expense, error) {
	ctx, span := s.tracer.Start(ctx, "ExpenseService.UpdateExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"expenseID": expenseID,
	})

	expense, err := s.expenseRepo.FindByID(ctx, expenseID)
	if err != nil {
		err := errors.New("expense not found")
		logger.Error(err)
		return nil, err
	}

	if amount != nil {
		expense.Amount = *amount
	}
	if currency != nil {
		expense.Currency = *currency
	}
	if category != nil {
		expense.Category = *category
	}
	if description != nil {
		expense.Description = *description
	}
	if date != nil {
		expense.Date = *date
	}
	if splitDetails != nil {
		expense.SplitDetails = *splitDetails
	}

	if err := s.expenseRepo.Update(ctx, expense); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(expense)
	return expense, nil
}

// DeleteExpense deletes an expense
func (s *ExpenseService) DeleteExpense(ctx context.Context, expenseID string) error {
	ctx, span := s.tracer.Start(ctx, "ExpenseService.DeleteExpense")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"expenseID": expenseID,
	})

	err := s.expenseRepo.Delete(ctx, expenseID)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Expense deleted successfully")
	return nil
}

// MarkExpenseAsSettled marks an expense as settled
func (s *ExpenseService) MarkExpenseAsSettled(ctx context.Context, expenseID string) error {
	expense, err := s.expenseRepo.FindByID(ctx, expenseID)
	if err != nil {
		return errors.New("expense not found")
	}

	expense.Status = models.ExpenseStatusSettled

	return s.expenseRepo.Update(ctx, expense)
}

// GetTotalExpensesByTrip calculates total expenses for a trip
func (s *ExpenseService) GetTotalExpensesByTrip(ctx context.Context, tripID string) (float64, error) {
	return s.expenseRepo.GetTotalByTrip(ctx, tripID)
}

// GetExpensesByCategory gets expenses filtered by category
func (s *ExpenseService) GetExpensesByCategory(ctx context.Context, tripID, category string) ([]*models.Expense, error) {
	return s.expenseRepo.FindByCategory(ctx, tripID, models.ExpenseCategory(category))
}
