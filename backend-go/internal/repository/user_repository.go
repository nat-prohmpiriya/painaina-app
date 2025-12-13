package repository

import (
	"context"
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

type UserRepository struct{
	tracer trace.Tracer
}

func NewUserRepository() *UserRepository {
	return &UserRepository{
		tracer: otel.Tracer("user-repository"),
	}
}

// Create creates a new user
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	ctx, span := r.tracer.Start(ctx, "UserRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"email":   user.Email,
		"clerkID": user.ClerkID,
	})

	// Set timestamps manually
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	err := mgm.Coll(user).CreateWithCtx(ctx, user)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"userID": user.ID.Hex(),
	})
	return nil
}

// FindByID finds a user by ID
func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	ctx, span := r.tracer.Start(ctx, "UserRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	user := &models.User{}
	err = mgm.Coll(user).FindByIDWithCtx(ctx, objectID, user)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"email":   user.Email,
		"clerkID": user.ClerkID,
	})
	return user, nil
}

// FindByClerkID finds a user by Clerk ID
func (r *UserRepository) FindByClerkID(ctx context.Context, clerkID string) (*models.User, error) {
	ctx, span := r.tracer.Start(ctx, "UserRepository.FindByClerkID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"clerkID": clerkID,
	})

	user := &models.User{}
	err := mgm.Coll(user).FirstWithCtx(ctx, bson.M{"clerk_id": clerkID}, user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Info("User not found, will create via JIT sync")
			return nil, nil
		}
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"userID": user.ID.Hex(),
		"email":  user.Email,
	})
	return user, nil
}

// FindByEmail finds a user by email
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	ctx, span := r.tracer.Start(ctx, "UserRepository.FindByEmail")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"email": email,
	})

	user := &models.User{}
	err := mgm.Coll(user).FirstWithCtx(ctx, bson.M{"email": email}, user)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"userID":  user.ID.Hex(),
		"clerkID": user.ClerkID,
	})
	return user, nil
}

// Update updates a user
func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	ctx, span := r.tracer.Start(ctx, "UserRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": user.ID.Hex(),
		"email":  user.Email,
	})

	err := mgm.Coll(user).UpdateWithCtx(ctx, user)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("User updated successfully")
	return nil
}

// Delete deletes a user (hard delete)
func (r *UserRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "UserRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	user := &models.User{}
	coll := mgm.Coll(user)
	_, err = coll.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("User deleted successfully")
	return nil
}

// List lists all users with pagination
func (r *UserRepository) List(ctx context.Context, skip, limit int64) ([]*models.User, error) {
	ctx, span := r.tracer.Start(ctx, "UserRepository.List")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"skip":  skip,
		"limit": limit,
	})

	users := []*models.User{}
	opts := options.Find().SetSkip(skip).SetLimit(limit)
	cursor, err := mgm.Coll(&models.User{}).Find(ctx, bson.M{}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &users)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(users),
	})
	return users, nil
}

// Count counts total users
func (r *UserRepository) Count(ctx context.Context) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "UserRepository.Count")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	count, err := mgm.Coll(&models.User{}).CountDocuments(ctx, bson.M{})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}

// Search searches users by email or name (case-insensitive)
func (r *UserRepository) Search(ctx context.Context, query string, limit int64) ([]*models.User, error) {
	ctx, span := r.tracer.Start(ctx, "UserRepository.Search")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"query": query,
		"limit": limit,
	})

	users := []*models.User{}

	// Search by email or name (case-insensitive regex)
	filter := bson.M{
		"$or": []bson.M{
			{"email": bson.M{"$regex": query, "$options": "i"}},
			{"name": bson.M{"$regex": query, "$options": "i"}},
		},
	}

	opts := options.Find().SetLimit(limit)
	cursor, err := mgm.Coll(&models.User{}).Find(ctx, filter, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &users)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(users),
	})
	return users, nil
}
