package repository

import (
	"context"
	"errors"
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"backend-go/internal/models"
	"backend-go/pkg/utils"
)

type CommentRepository struct{
	tracer trace.Tracer
}

func NewCommentRepository() *CommentRepository {
	return &CommentRepository{
		tracer: otel.Tracer("comment-repository"),
	}
}

// Helper methods to encapsulate ObjectID logic

// NewComment creates a new Comment with ObjectIDs from strings
func (r *CommentRepository) NewComment(userID, targetID, targetType string) (*models.Comment, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	targetObjID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		return nil, err
	}

	// Validate target type
	if targetType != models.CommentTargetTrip && targetType != models.CommentTargetPlace {
		return nil, errors.New("invalid target type")
	}

	return &models.Comment{
		UserID:         userObjID,
		TargetID:       targetObjID,
		TargetType:     targetType,
		ReactionsCount: 0,
		RepliesCount:   0,
		IsEdited:       false,
	}, nil
}

// SetParentID sets ParentID from string (optional)
func (r *CommentRepository) SetParentID(comment *models.Comment, parentID string) error {
	if parentID == "" {
		return nil
	}

	parentObjID, err := primitive.ObjectIDFromHex(parentID)
	if err != nil {
		return err
	}

	comment.ParentID = &parentObjID
	return nil
}

// IsOwner checks if user owns the comment
func (r *CommentRepository) IsOwner(comment *models.Comment, userID string) bool {
	return comment.UserID.Hex() == userID
}

// Create creates a new comment
func (r *CommentRepository) Create(ctx context.Context, comment *models.Comment) error {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     comment.UserID.Hex(),
		"targetID":   comment.TargetID.Hex(),
		"targetType": comment.TargetType,
	})

	// Set timestamps manually
	now := time.Now()
	comment.CreatedAt = now
	comment.UpdatedAt = now

	err := mgm.Coll(comment).CreateWithCtx(ctx, comment)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"commentID": comment.ID.Hex(),
	})
	return nil
}

// FindByID finds a comment by ID (excluding soft deleted)
func (r *CommentRepository) FindByID(ctx context.Context, id string) (*models.Comment, error) {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	comment := &models.Comment{}
	err = mgm.Coll(comment).FirstWithCtx(ctx, bson.M{
		"_id":        objectID,
		"deleted_at": nil,
	}, comment)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"userID":     comment.UserID.Hex(),
		"targetType": comment.TargetType,
	})
	return comment, nil
}

// FindByTargetID finds all comments for a target (trip or comment) with user data
func (r *CommentRepository) FindByTargetID(ctx context.Context, targetID, targetType string, skip, limit int64) ([]*models.CommentWithUser, error) {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.FindByTargetID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"targetID":   targetID,
		"targetType": targetType,
		"skip":       skip,
		"limit":      limit,
	})

	objectID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Aggregation pipeline to join with users collection
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"target_id":   objectID,
				"target_type": targetType,
				"deleted_at":  nil,
				"parent_id":   nil, // Top-level comments only
			},
		},
		{
			"$sort": bson.M{"created_at": -1},
		},
		{
			"$skip": skip,
		},
		{
			"$limit": limit,
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "user_id",
				"foreignField": "_id",
				"as":           "user",
			},
		},
		{
			"$unwind": bson.M{
				"path":                       "$user",
				"preserveNullAndEmptyArrays": true,
			},
		},
		{
			"$project": bson.M{
				"_id":              1,
				"created_at":       1,
				"updated_at":       1,
				"user_id":          1,
				"target_id":        1,
				"target_type":      1,
				"content":          1,
				"photos":           1,
				"reactions_count":  1,
				"replies_count":    1,
				"parent_id":        1,
				"is_edited":        1,
				"deleted_at":       1,
				"user._id":         1,
				"user.name":        1,
				"user.photo_url":   1,
			},
		},
	}

	comments := []*models.CommentWithUser{}
	cursor, err := mgm.Coll(&models.Comment{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &comments)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(comments),
	})
	return comments, nil
}

// FindReplies finds all replies to a comment with user data
func (r *CommentRepository) FindReplies(ctx context.Context, parentID string, skip, limit int64) ([]*models.CommentWithUser, error) {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.FindReplies")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"parentID": parentID,
		"skip":     skip,
		"limit":    limit,
	})

	objectID, err := primitive.ObjectIDFromHex(parentID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Aggregation pipeline to join with users collection
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"parent_id":  objectID,
				"deleted_at": nil,
			},
		},
		{
			"$sort": bson.M{"created_at": 1}, // Ascending for replies
		},
		{
			"$skip": skip,
		},
		{
			"$limit": limit,
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "user_id",
				"foreignField": "_id",
				"as":           "user",
			},
		},
		{
			"$unwind": bson.M{
				"path":                       "$user",
				"preserveNullAndEmptyArrays": true,
			},
		},
		{
			"$project": bson.M{
				"_id":              1,
				"created_at":       1,
				"updated_at":       1,
				"user_id":          1,
				"target_id":        1,
				"target_type":      1,
				"content":          1,
				"photos":           1,
				"reactions_count":  1,
				"replies_count":    1,
				"parent_id":        1,
				"is_edited":        1,
				"deleted_at":       1,
				"user._id":         1,
				"user.name":        1,
				"user.photo_url":   1,
			},
		},
	}

	comments := []*models.CommentWithUser{}
	cursor, err := mgm.Coll(&models.Comment{}).Aggregate(ctx, pipeline)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &comments)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(comments),
	})
	return comments, nil
}

// FindByUserID finds all comments by a user
func (r *CommentRepository) FindByUserID(ctx context.Context, userID string, skip, limit int64) ([]*models.Comment, error) {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.FindByUserID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID": userID,
		"skip":   skip,
		"limit":  limit,
	})

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	comments := []*models.Comment{}
	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(skip).
		SetLimit(limit)

	cursor, err := mgm.Coll(&models.Comment{}).Find(ctx, bson.M{
		"user_id":    objectID,
		"deleted_at": nil,
	}, opts)
	if err != nil {
		logger.Error(err)
		return nil, err
	}
	defer cursor.Close(ctx)

	err = cursor.All(ctx, &comments)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(comments),
	})
	return comments, nil
}

// Update updates a comment
func (r *CommentRepository) Update(ctx context.Context, comment *models.Comment) error {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": comment.ID.Hex(),
	})

	err := mgm.Coll(comment).UpdateWithCtx(ctx, comment)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Comment updated successfully")
	return nil
}

// SoftDelete soft deletes a comment
func (r *CommentRepository) SoftDelete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.SoftDelete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	comment := &models.Comment{}
	err = mgm.Coll(comment).FindByIDWithCtx(ctx, objectID, comment)
	if err != nil {
		logger.Error(err)
		return err
	}

	comment.SoftDelete()
	err = mgm.Coll(comment).UpdateWithCtx(ctx, comment)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Comment soft deleted successfully")
	return nil
}

// Delete hard deletes a comment
func (r *CommentRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"commentID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.Comment{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Comment deleted successfully")
	return nil
}

// CountByTargetID counts comments for a target
func (r *CommentRepository) CountByTargetID(ctx context.Context, targetID, targetType string) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.CountByTargetID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"targetID":   targetID,
		"targetType": targetType,
	})

	objectID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	count, err := mgm.Coll(&models.Comment{}).CountDocuments(ctx, bson.M{
		"target_id":   objectID,
		"target_type": targetType,
		"deleted_at":  nil,
		"parent_id":   nil,
	})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}

// CountReplies counts replies to a comment
func (r *CommentRepository) CountReplies(ctx context.Context, parentID string) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "CommentRepository.CountReplies")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"parentID": parentID,
	})

	objectID, err := primitive.ObjectIDFromHex(parentID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	count, err := mgm.Coll(&models.Comment{}).CountDocuments(ctx, bson.M{
		"parent_id":  objectID,
		"deleted_at": nil,
	})
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	logger.Output(map[string]interface{}{
		"count": count,
	})
	return count, nil
}
