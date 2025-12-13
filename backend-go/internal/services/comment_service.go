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

type CommentService struct {
	commentRepo     *repository.CommentRepository
	interactionRepo *repository.InteractionRepository
	tracer          trace.Tracer
}

func NewCommentService() *CommentService {
	return &CommentService{
		commentRepo:     repository.NewCommentRepository(),
		interactionRepo: repository.NewInteractionRepository(),
		tracer:          otel.Tracer("comment-service"),
	}
}

// CreateComment creates a new comment
func (s *CommentService) CreateComment(ctx context.Context, userID, targetID, targetType, content string, photos []string, parentID *string) (*models.Comment, error) {
	ctx, span := s.tracer.Start(ctx, "CommentService.CreateComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     userID,
		"targetID":   targetID,
		"targetType": targetType,
		"hasParent":  parentID != nil,
	})

	// Use repository helper to create comment with ObjectIDs
	comment, err := s.commentRepo.NewComment(userID, targetID, targetType)
	if err != nil {
		err := errors.New("invalid IDs or target type")
		logger.Error(err)
		return nil, err
	}

	// Set other fields
	comment.Content = content
	comment.Photos = photos

	// Handle replies
	if parentID != nil && *parentID != "" {
		// Verify parent comment exists
		parentComment, err := s.commentRepo.FindByID(ctx, *parentID)
		if err != nil {
			err := errors.New("parent comment not found")
			logger.Error(err)
			return nil, err
		}

		// Verify parent comment targets the same entity
		if parentComment.TargetID.Hex() != targetID || parentComment.TargetType != targetType {
			err := errors.New("parent comment does not match target")
			logger.Error(err)
			return nil, err
		}

		// Set ParentID using helper
		if err := s.commentRepo.SetParentID(comment, *parentID); err != nil {
			err := errors.New("invalid parent ID")
			logger.Error(err)
			return nil, err
		}

		// Increment parent's replies count
		parentComment.IncrementReplies()
		if err := s.commentRepo.Update(ctx, parentComment); err != nil {
			logger.Error(err)
			return nil, err
		}
	}

	if err := s.commentRepo.Create(ctx, comment); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"commentID": comment.ID.Hex()})
	return comment, nil
}

// GetComment gets a comment by ID with replies
func (s *CommentService) GetComment(ctx context.Context, commentID string) (*models.Comment, error) {
	ctx, span := s.tracer.Start(ctx, "CommentService.GetComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"commentID": commentID})

	comment, err := s.commentRepo.FindByID(ctx, commentID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(comment)
	return comment, nil
}

// GetCommentsByTarget gets comments for a target (trip or place) with user data
func (s *CommentService) GetCommentsByTarget(ctx context.Context, targetID, targetType string, limit, offset int) ([]*models.CommentWithUser, error) {
	ctx, span := s.tracer.Start(ctx, "CommentService.GetCommentsByTarget")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"targetID":   targetID,
		"targetType": targetType,
		"limit":      limit,
		"offset":     offset,
	})

	if limit == 0 {
		limit = 20
	}

	comments, err := s.commentRepo.FindByTargetID(ctx, targetID, targetType, int64(offset), int64(limit))
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(comments)})
	return comments, nil
}

// GetReplies gets replies for a comment with user data
func (s *CommentService) GetReplies(ctx context.Context, commentID string) ([]*models.CommentWithUser, error) {
	ctx, span := s.tracer.Start(ctx, "CommentService.GetReplies")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{"commentID": commentID})

	replies, err := s.commentRepo.FindReplies(ctx, commentID, 0, 100) // Default limit 100 replies
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(replies)})
	return replies, nil
}

// UpdateComment updates a comment
func (s *CommentService) UpdateComment(ctx context.Context, commentID, userID, content string, photos []string) (*models.Comment, error) {
	ctx, span := s.tracer.Start(ctx, "CommentService.UpdateComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
	})

	comment, err := s.commentRepo.FindByID(ctx, commentID)
	if err != nil {
		err := errors.New("comment not found")
		logger.Error(err)
		return nil, err
	}

	// Check ownership using repository helper
	if !s.commentRepo.IsOwner(comment, userID) {
		err := errors.New("unauthorized: you don't own this comment")
		logger.Error(err)
		return nil, err
	}

	// Check if deleted
	if comment.IsDeleted() {
		err := errors.New("comment has been deleted")
		logger.Error(err)
		return nil, err
	}

	// Update fields
	comment.Content = content
	if photos != nil {
		comment.Photos = photos
	}
	comment.MarkAsEdited()

	if err := s.commentRepo.Update(ctx, comment); err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(comment)
	return comment, nil
}

// DeleteComment soft deletes a comment
func (s *CommentService) DeleteComment(ctx context.Context, commentID, userID string, isAdmin bool) error {
	ctx, span := s.tracer.Start(ctx, "CommentService.DeleteComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
		"isAdmin":   isAdmin,
	})

	comment, err := s.commentRepo.FindByID(ctx, commentID)
	if err != nil {
		err := errors.New("comment not found")
		logger.Error(err)
		return err
	}

	// Check ownership or admin using repository helper
	if !s.commentRepo.IsOwner(comment, userID) && !isAdmin {
		err := errors.New("unauthorized: you don't own this comment")
		logger.Error(err)
		return err
	}

	// Check if already deleted
	if comment.IsDeleted() {
		err := errors.New("comment already deleted")
		logger.Error(err)
		return err
	}

	err = s.commentRepo.SoftDelete(ctx, commentID)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Comment deleted successfully")
	return nil
}

// LikeComment adds a like to a comment
func (s *CommentService) LikeComment(ctx context.Context, commentID, userID string) error {
	ctx, span := s.tracer.Start(ctx, "CommentService.LikeComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
	})

	comment, err := s.commentRepo.FindByID(ctx, commentID)
	if err != nil {
		err := errors.New("comment not found")
		logger.Error(err)
		return err
	}

	if comment.IsDeleted() {
		err := errors.New("comment has been deleted")
		logger.Error(err)
		return err
	}

	// Check if already liked
	hasLiked, err := s.interactionRepo.Exists(ctx, userID, commentID, models.InteractionTargetComment, models.ActionLike)
	if err != nil {
		logger.Error(err)
		return err
	}
	if hasLiked {
		err := errors.New("already liked")
		logger.Error(err)
		return err
	}

	// Create interaction record using repository helper
	interaction, err := s.interactionRepo.NewInteraction(userID, commentID, models.InteractionTargetComment, models.ActionLike)
	if err != nil {
		err := errors.New("invalid IDs")
		logger.Error(err)
		return err
	}

	if err := s.interactionRepo.Create(ctx, interaction); err != nil {
		logger.Error(err)
		return err
	}

	// Increment comment reactions count
	comment.IncrementReactions()
	err = s.commentRepo.Update(ctx, comment)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Comment liked successfully")
	return nil
}

// UnlikeComment removes a like from a comment
func (s *CommentService) UnlikeComment(ctx context.Context, commentID, userID string) error {
	ctx, span := s.tracer.Start(ctx, "CommentService.UnlikeComment")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": commentID,
		"userID":    userID,
	})

	comment, err := s.commentRepo.FindByID(ctx, commentID)
	if err != nil {
		err := errors.New("comment not found")
		logger.Error(err)
		return err
	}

	// Check if liked
	hasLiked, err := s.interactionRepo.Exists(ctx, userID, commentID, models.InteractionTargetComment, models.ActionLike)
	if err != nil {
		logger.Error(err)
		return err
	}
	if !hasLiked {
		err := errors.New("not liked")
		logger.Error(err)
		return err
	}

	// Delete interaction record
	if err := s.interactionRepo.DeleteByUserAndTarget(ctx, userID, commentID, models.InteractionTargetComment, models.ActionLike); err != nil {
		logger.Error(err)
		return err
	}

	// Decrement comment reactions count
	comment.DecrementReactions()
	err = s.commentRepo.Update(ctx, comment)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Comment unliked successfully")
	return nil
}

// CountComments counts comments for a target
func (s *CommentService) CountComments(ctx context.Context, targetID, targetType string) (int64, error) {
	ctx, span := s.tracer.Start(ctx, "CommentService.CountComments")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"targetID":   targetID,
		"targetType": targetType,
	})

	count, err := s.commentRepo.CountByTargetID(ctx, targetID, targetType)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{"count": count})
	return count, nil
}

// GetUserComments gets all comments by a user
func (s *CommentService) GetUserComments(ctx context.Context, userID string, limit, offset int) ([]*models.Comment, error) {
	ctx, span := s.tracer.Start(ctx, "CommentService.GetUserComments")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": userID,
		"limit":  limit,
		"offset": offset,
	})

	if limit == 0 {
		limit = 20
	}

	comments, err := s.commentRepo.FindByUserID(ctx, userID, int64(offset), int64(limit))
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{"count": len(comments)})
	return comments, nil
}

// GetCommentByID retrieves a comment by ID
func (s *CommentService) GetCommentByID(ctx context.Context, commentID string) (*models.Comment, error) {
	return s.commentRepo.FindByID(ctx, commentID)
}

// GetTripByID retrieves a trip by ID (for notification purposes)
func (s *CommentService) GetTripByID(ctx context.Context, tripID string) (*models.Trip, error) {
	tripRepo := repository.NewTripRepository()
	return tripRepo.FindByID(ctx, tripID)
}
