package repository

import (
	"context"
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

type InteractionRepository struct{
	tracer trace.Tracer
}

func NewInteractionRepository() *InteractionRepository {
	return &InteractionRepository{
		tracer: otel.Tracer("interaction-repository"),
	}
}

// Helper methods to encapsulate ObjectID logic

// NewInteraction creates a new Interaction with ObjectIDs from strings
func (r *InteractionRepository) NewInteraction(userID, targetID string, targetType models.InteractionTarget, actionType models.InteractionAction) (*models.Interaction, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	targetObjID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		return nil, err
	}

	return &models.Interaction{
		UserID:     userObjID,
		TargetID:   targetObjID,
		TargetType: targetType,
		ActionType: actionType,
	}, nil
}

// Create creates a new interaction
func (r *InteractionRepository) Create(ctx context.Context, interaction *models.Interaction) error {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.Create")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     interaction.UserID.Hex(),
		"targetID":   interaction.TargetID.Hex(),
		"targetType": interaction.TargetType,
		"actionType": interaction.ActionType,
	})

	// Set timestamps manually
	now := time.Now()
	interaction.CreatedAt = now
	interaction.UpdatedAt = now

	err := mgm.Coll(interaction).CreateWithCtx(ctx, interaction)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Output(map[string]interface{}{
		"interactionID": interaction.ID.Hex(),
	})
	return nil
}

// FindByID finds an interaction by ID
func (r *InteractionRepository) FindByID(ctx context.Context, id string) (*models.Interaction, error) {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.FindByID")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"interactionID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	interaction := &models.Interaction{}
	err = mgm.Coll(interaction).FindByIDWithCtx(ctx, objectID, interaction)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"userID":     interaction.UserID.Hex(),
		"targetType": interaction.TargetType,
		"actionType": interaction.ActionType,
	})
	return interaction, nil
}

// FindOne finds a specific interaction by user, target, and action
func (r *InteractionRepository) FindOne(ctx context.Context, userID, targetID string, targetType models.InteractionTarget, actionType models.InteractionAction) (*models.Interaction, error) {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.FindOne")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     userID,
		"targetID":   targetID,
		"targetType": targetType,
		"actionType": actionType,
	})

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	targetObjectID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	interaction := &models.Interaction{}
	err = mgm.Coll(interaction).FirstWithCtx(ctx, bson.M{
		"user_id":     userObjectID,
		"target_id":   targetObjectID,
		"target_type": targetType,
		"action_type": actionType,
	}, interaction)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"interactionID": interaction.ID.Hex(),
	})
	return interaction, nil
}

// Exists checks if an interaction exists
func (r *InteractionRepository) Exists(ctx context.Context, userID, targetID string, targetType models.InteractionTarget, actionType models.InteractionAction) (bool, error) {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.Exists")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     userID,
		"targetID":   targetID,
		"targetType": targetType,
		"actionType": actionType,
	})

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return false, err
	}

	targetObjectID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		logger.Error(err)
		return false, err
	}

	count, err := mgm.Coll(&models.Interaction{}).CountDocuments(ctx, bson.M{
		"user_id":     userObjectID,
		"target_id":   targetObjectID,
		"target_type": targetType,
		"action_type": actionType,
	})
	if err != nil {
		logger.Error(err)
		return false, err
	}

	exists := count > 0
	logger.Output(map[string]interface{}{
		"exists": exists,
	})
	return exists, nil
}

// CountByTarget counts interactions for a target by action type
func (r *InteractionRepository) CountByTarget(ctx context.Context, targetID string, targetType models.InteractionTarget, actionType models.InteractionAction) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.CountByTarget")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"targetID":   targetID,
		"targetType": targetType,
		"actionType": actionType,
	})

	objectID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		logger.Error(err)
		return 0, err
	}

	count, err := mgm.Coll(&models.Interaction{}).CountDocuments(ctx, bson.M{
		"target_id":   objectID,
		"target_type": targetType,
		"action_type": actionType,
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

// CountReactionsByTarget counts all reactions (like + love + angry) for a target
func (r *InteractionRepository) CountReactionsByTarget(ctx context.Context, targetID string, targetType models.InteractionTarget) (int64, error) {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.CountReactionsByTarget")
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

	count, err := mgm.Coll(&models.Interaction{}).CountDocuments(ctx, bson.M{
		"target_id":   objectID,
		"target_type": targetType,
		"action_type": bson.M{
			"$in": []models.InteractionAction{
				models.ActionLike,
				models.ActionLove,
				models.ActionAngry,
			},
		},
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

// FindByUser finds all interactions by a user for a specific action
func (r *InteractionRepository) FindByUser(ctx context.Context, userID string, actionType models.InteractionAction) ([]*models.Interaction, error) {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.FindByUser")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     userID,
		"actionType": actionType,
	})

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	interactions := []*models.Interaction{}
	err = mgm.Coll(&models.Interaction{}).SimpleFindWithCtx(ctx, &interactions, bson.M{
		"user_id":     objectID,
		"action_type": actionType,
	})
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"count": len(interactions),
	})
	return interactions, nil
}

// Update updates an interaction (for changing reactions)
func (r *InteractionRepository) Update(ctx context.Context, interaction *models.Interaction) error {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.Update")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"interactionID": interaction.ID.Hex(),
	})

	err := mgm.Coll(interaction).UpdateWithCtx(ctx, interaction)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Interaction updated successfully")
	return nil
}

// Delete deletes an interaction
func (r *InteractionRepository) Delete(ctx context.Context, id string) error {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.Delete")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"interactionID": id,
	})

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.Interaction{}).DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Interaction deleted successfully")
	return nil
}

// DeleteByUserAndTarget deletes an interaction by user, target, and action
func (r *InteractionRepository) DeleteByUserAndTarget(ctx context.Context, userID, targetID string, targetType models.InteractionTarget, actionType models.InteractionAction) error {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.DeleteByUserAndTarget")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     userID,
		"targetID":   targetID,
		"targetType": targetType,
		"actionType": actionType,
	})

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		logger.Error(err)
		return err
	}

	targetObjectID, err := primitive.ObjectIDFromHex(targetID)
	if err != nil {
		logger.Error(err)
		return err
	}

	_, err = mgm.Coll(&models.Interaction{}).DeleteOne(ctx, bson.M{
		"user_id":     userObjectID,
		"target_id":   targetObjectID,
		"target_type": targetType,
		"action_type": actionType,
	})
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Interaction deleted successfully")
	return nil
}

// UpsertUnique upserts a unique interaction (for reactions and bookmarks)
// This prevents duplicate unique interactions
func (r *InteractionRepository) UpsertUnique(ctx context.Context, interaction *models.Interaction) error {
	ctx, span := r.tracer.Start(ctx, "InteractionRepository.UpsertUnique")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"userID":     interaction.UserID.Hex(),
		"targetID":   interaction.TargetID.Hex(),
		"targetType": interaction.TargetType,
		"actionType": interaction.ActionType,
	})

	filter := bson.M{
		"user_id":     interaction.UserID,
		"target_id":   interaction.TargetID,
		"target_type": interaction.TargetType,
		"action_type": interaction.ActionType,
	}

	update := bson.M{
		"$set": bson.M{
			"user_id":     interaction.UserID,
			"target_id":   interaction.TargetID,
			"target_type": interaction.TargetType,
			"action_type": interaction.ActionType,
		},
		"$setOnInsert": bson.M{
			"created_at": interaction.CreatedAt,
			"updated_at": interaction.UpdatedAt,
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err := mgm.Coll(interaction).UpdateOne(ctx, filter, update, opts)
	if err != nil {
		logger.Error(err)
		return err
	}

	logger.Info("Interaction upserted successfully")
	return nil
}
