package services

import (
	"context"
	"errors"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/pkg/utils"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type UserService struct {
	userRepo *repository.UserRepository
	tracer   trace.Tracer
}

func NewUserService() *UserService {
	return &UserService{
		userRepo: repository.NewUserRepository(),
		tracer:   otel.Tracer("user-service"),
	}
}

func (s *UserService) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	ctx, span := s.tracer.Start(ctx, "UserService.GetUserByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": userID,
	})

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(user)
	return user, nil
}

func (s *UserService) UpdateUser(ctx context.Context, user *models.User) error {
	ctx, span := s.tracer.Start(ctx, "UserService.UpdateUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": user.ID.Hex(),
		"name":   user.Name,
	})

	// Validate business rules
	if user.Name == "" {
		err := errors.New("name cannot be empty")
		logger.Error(err)
		return err
	}

	// Email is immutable - this is enforced in the handler/schema
	// but adding extra check here
	existingUser, err := s.userRepo.FindByID(ctx, user.ID.Hex())
	if err != nil {
		logger.Error(err)
		return err
	}

	if existingUser.Email != user.Email {
		err := errors.New("email cannot be changed")
		logger.Error(err)
		return err
	}

	err = s.userRepo.Update(ctx, user)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(user)
	return nil
}

func (s *UserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	ctx, span := s.tracer.Start(ctx, "UserService.GetUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": userID,
	})

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(user)
	return user, nil
}

func (s *UserService) ListUsers(ctx context.Context, limit int) ([]*models.User, error) {
	ctx, span := s.tracer.Start(ctx, "UserService.ListUsers")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"limit": limit,
	})

	if limit == 0 {
		limit = 20
	}

	users, err := s.userRepo.List(ctx, 0, int64(limit))
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(users),
	})
	return users, nil
}

func (s *UserService) DeleteUser(ctx context.Context, userID string) error {
	ctx, span := s.tracer.Start(ctx, "UserService.DeleteUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": userID,
	})

	// Check if user exists
	_, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		logger.Error(err)
		return errors.New("user not found")
	}

	// TODO: Add cleanup logic here
	// - Delete user's trips
	// - Delete user's comments
	// - Remove user from trip members
	// etc.

	err = s.userRepo.Delete(ctx, userID)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output("User deleted successfully")
	return nil
}

func (s *UserService) SearchUsers(ctx context.Context, query string) ([]*models.User, error) {
	ctx, span := s.tracer.Start(ctx, "UserService.SearchUsers")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"query": query,
	})

	// Validate query
	if query == "" || len(query) < 2 {
		err := errors.New("search query must be at least 2 characters")
		logger.Error(err)
		return nil, err
	}

	// Default limit
	limit := int64(10)

	users, err := s.userRepo.Search(ctx, query, limit)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(users),
	})
	return users, nil
}
