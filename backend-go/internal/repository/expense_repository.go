package repository

import (
	"context"
	"errors"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"backend-go/internal/models"
	"backend-go/pkg/utils"
)

type ExpenseRepository struct{
	tracer trace.Tracer
}

func NewExpenseRepository() *ExpenseRepository {
	return &ExpenseRepository{
		tracer: otel.Tracer("expense-repository"),
	}
}

// Helper methods to encapsulate ObjectID logic

// NewExpense creates a new Expense with ObjectIDs from strings
func (r *ExpenseRepository) NewExpense(tripID, paidBy string, splitWith []string) (*models.Expense, error) {
	tripObjID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		return nil, err
	}

	paidByObjID, err := primitive.ObjectIDFromHex(paidBy)
	if err != nil {
		return nil, err
	}

	// Convert splitWith to ObjectIDs
	splitWithObjIDs := make([]primitive.ObjectID, len(splitWith))
	for i, userID := range splitWith {
		objID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			return nil, errors.New("invalid split with user ID")
		}
		splitWithObjIDs[i] = objID
	}

	return &models.Expense{
		TripID:    tripObjID,
		PaidBy:    paidByObjID,
		SplitWith: splitWithObjIDs,
	}, nil
}

// SetEntryID sets EntryID from string (optional)
func (r *ExpenseRepository) SetEntryID(expense *models.Expense, entryID string) error {
	if entryID == "" {
		return nil
	}

	entryObjID, err := primitive.ObjectIDFromHex(entryID)
	if err != nil {
		return err
	}

	expense.EntryID = &entryObjID
	return nil
}

// Create creates a new expense
func (r *ExpenseRepository) Create(ctx context.Context, expense *models.Expense) error {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":   expense.TripID.Hex(),
		"amount":   expense.Amount,
		"category": expense.Category,
	})

	// Set timestamps manually
	now := time.Now()
	expense.CreatedAt = now
	expense.UpdatedAt = now

	err := mgm.Coll(expense).CreateWithCtx(ctx, expense)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"expenseID": expense.ID.Hex(),
	})
	return nil
}

// FindByID finds an expense by ID
func (r *ExpenseRepository) FindByID(ctx context.Context, id string) (*models.Expense, error) {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"expenseID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	expense := &models.Expense{}
	err = mgm.Coll(expense).FindByIDWithCtx(ctx, objectID, expense)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"amount":   expense.Amount,
		"category": expense.Category,
	})
	return expense, nil
}

// FindByTripID finds all expenses for a trip
func (r *ExpenseRepository) FindByTripID(ctx context.Context, tripID string) ([]*models.Expense, error) {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.FindByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	expenses := []*models.Expense{}
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := mgm.Coll(&models.Expense{}).Find(ctx, bson.M{"trip_id": objectID}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &expenses)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(expenses),
	})
	return expenses, nil
}

// FindByCategory finds expenses by category
func (r *ExpenseRepository) FindByCategory(ctx context.Context, tripID string, category models.ExpenseCategory) ([]*models.Expense, error) {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.FindByCategory")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":   tripID,
		"category": category,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	expenses := []*models.Expense{}
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := mgm.Coll(&models.Expense{}).Find(ctx, bson.M{
		"trip_id":  objectID,
		"category": category,
	}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &expenses)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(expenses),
	})
	return expenses, nil
}

// FindByPaidBy finds expenses paid by a specific user
func (r *ExpenseRepository) FindByPaidBy(ctx context.Context, tripID, userID string) ([]*models.Expense, error) {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.FindByPaidBy")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"userID": userID,
	})

	tripObjectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	expenses := []*models.Expense{}
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := mgm.Coll(&models.Expense{}).Find(ctx, bson.M{
		"trip_id": tripObjectID,
		"paid_by": userObjectID,
	}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &expenses)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(expenses),
	})
	return expenses, nil
}

// GetTotalByTrip calculates total expenses for a trip
func (r *ExpenseRepository) GetTotalByTrip(ctx context.Context, tripID string) (float64, error) {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.GetTotalByTrip")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"trip_id": objectID}}},
		{{Key: "$group", Value: bson.M{
			"_id":   nil,
			"total": bson.M{"$sum": "$amount"},
		}}},
	}

	cursor, err := mgm.Coll(&models.Expense{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return 0, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		logger.Error(err)
		return 0, err
	}

	if len(results) == 0 {
		logger.Output(map[string]interface{}{
			"total": 0,
		})
		return 0, nil
	}

	total, ok := results[0]["total"].(float64)
	if !ok {
		logger.Output(map[string]interface{}{
			"total": 0,
		})
		return 0, nil
	}

	logger.Output(map[string]interface{}{
		"total": total,
	})
	return total, nil
}

// GetTotalByCategory calculates total expenses by category
func (r *ExpenseRepository) GetTotalByCategory(ctx context.Context, tripID string) (map[string]float64, error) {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.GetTotalByCategory")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"trip_id": objectID}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$category",
			"total": bson.M{"$sum": "$amount"},
		}}},
	}

	cursor, err := mgm.Coll(&models.Expense{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		logger.Error(err)
		return nil, err
	}

	totals := make(map[string]float64)
	for _, result := range results {
		category, ok := result["_id"].(string)
		if !ok {
			continue
		}
		total, ok := result["total"].(float64)
		if !ok {
			continue
		}
		totals[category] = total
	}

	logger.Output(map[string]interface{}{
		"categories": len(totals),
	})
	return totals, nil
}

// Update updates an expense
func (r *ExpenseRepository) Update(ctx context.Context, expense *models.Expense) error {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"expenseID": expense.ID.Hex(),
		"amount":    expense.Amount,
	})

	err := mgm.Coll(expense).UpdateWithCtx(ctx, expense)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Expense updated successfully")
	return nil
}

// Delete deletes an expense
func (r *ExpenseRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"expenseID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.Expense{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Expense deleted successfully")
	return nil
}

// DeleteByTripID deletes all expenses for a trip
func (r *ExpenseRepository) DeleteByTripID(ctx context.Context, tripID string) error {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.DeleteByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return err
	}

	result, err := mgm.Coll(&models.Expense{}).DeleteMany(ctx, bson.M{"trip_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"deletedCount": result.DeletedCount,
	})
	return nil
}

// CountByTripID counts total expenses for a trip
func (r *ExpenseRepository) CountByTripID(ctx context.Context, tripID string) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "ExpenseRepository.CountByTripID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	objectID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	count, err := mgm.Coll(&models.Expense{}).CountDocuments(ctx, bson.M{"trip_id": objectID})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}
