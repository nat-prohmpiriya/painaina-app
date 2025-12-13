package models

import (
	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Interaction represents user interactions (reactions, views, bookmarks, shares)
type Interaction struct {
	mgm.DefaultModel `bson:",inline"`

	UserID     primitive.ObjectID `bson:"user_id" json:"userId"`
	TargetID   primitive.ObjectID `bson:"target_id" json:"targetId"`
	TargetType InteractionTarget  `bson:"target_type" json:"targetType"` // trip, comment
	ActionType InteractionAction  `bson:"action_type" json:"actionType"` // like, love, angry, view, bookmark, share
}

// InteractionTarget represents the target of an interaction
type InteractionTarget string

const (
	InteractionTargetTrip    InteractionTarget = "trip"
	InteractionTargetComment InteractionTarget = "comment"
)

// InteractionAction represents the type of interaction
type InteractionAction string

const (
	// Reactions (unique per user+target)
	ActionLike  InteractionAction = "like"
	ActionLove  InteractionAction = "love"
	ActionAngry InteractionAction = "angry"
	
	// Actions
	ActionView     InteractionAction = "view"     // Not unique - count all views
	ActionBookmark InteractionAction = "bookmark" // Unique per user+target
	ActionShare    InteractionAction = "share"    // Not unique - count all shares
)

// CollectionName returns the collection name for Interaction
func (i *Interaction) CollectionName() string {
	return "interactions"
}

// IsReaction checks if action is a reaction type (like, love, angry)
func (i *Interaction) IsReaction() bool {
	return i.ActionType == ActionLike || 
	       i.ActionType == ActionLove || 
	       i.ActionType == ActionAngry
}

// IsUnique checks if action should be unique per user+target
func (i *Interaction) IsUnique() bool {
	return i.IsReaction() || i.ActionType == ActionBookmark
}

// IsCountable checks if action should increment cached counts
func (i *Interaction) IsCountable() bool {
	// View and Share are not unique but still countable
	// Reactions and Bookmarks are unique and countable
	return true
}
