package models

import (
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Comment represents a comment on a trip or reply to another comment
type Comment struct {
	mgm.DefaultModel `bson:",inline"`

	UserID     primitive.ObjectID  `bson:"user_id" json:"userId"`
	TargetID   primitive.ObjectID  `bson:"target_id" json:"targetId"`
	TargetType string              `bson:"target_type" json:"targetType"` // trip, comment
	Content    string              `bson:"content" json:"content"`
	Photos     []string            `bson:"photos,omitempty" json:"photos,omitempty"`
	
	// Cached counts from Interaction collection
	ReactionsCount int `bson:"reactions_count" json:"reactionsCount"` // like + love + angry
	RepliesCount   int `bson:"replies_count" json:"repliesCount"`
	
	ParentID  *primitive.ObjectID `bson:"parent_id,omitempty" json:"parentId,omitempty"`   // For replies
	IsEdited  bool                `bson:"is_edited" json:"isEdited"`                       // Track edits
	DeletedAt *time.Time          `bson:"deleted_at,omitempty" json:"deletedAt,omitempty"` // Soft delete
}

// Constants for Comment target type
const (
	CommentTargetTrip    = "trip"
	CommentTargetPlace   = "place"
	CommentTargetComment = "comment"
)

// CollectionName returns the collection name for Comment
func (c *Comment) CollectionName() string {
	return "comments"
}

// IsDeleted checks if comment is soft deleted
func (c *Comment) IsDeleted() bool {
	return c.DeletedAt != nil
}

// SoftDelete marks comment as deleted
func (c *Comment) SoftDelete() {
	now := time.Now()
	c.DeletedAt = &now
}

// GetReactionCount returns the number of reactions
func (c *Comment) GetReactionCount() int {
	return c.ReactionsCount
}

// IncrementReactions increments the reactions count
func (c *Comment) IncrementReactions() {
	c.ReactionsCount++
}

// DecrementReactions decrements the reactions count
func (c *Comment) DecrementReactions() {
	if c.ReactionsCount > 0 {
		c.ReactionsCount--
	}
}

// IncrementReplies increments the replies count
func (c *Comment) IncrementReplies() {
	c.RepliesCount++
}

// DecrementReplies decrements the replies count
func (c *Comment) DecrementReplies() {
	if c.RepliesCount > 0 {
		c.RepliesCount--
	}
}

// MarkAsEdited marks comment as edited
func (c *Comment) MarkAsEdited() {
	c.IsEdited = true
}

// CommentUser represents minimal user information for comments
type CommentUser struct {
	ID       primitive.ObjectID `bson:"_id" json:"_id"`
	Name     string             `bson:"name" json:"name"`
	PhotoURL string             `bson:"photo_url,omitempty" json:"photoUrl,omitempty"`
}

// CommentWithUser represents a comment with user information from aggregation
type CommentWithUser struct {
	Comment `bson:",inline"`
	User    *CommentUser `bson:"user,omitempty" json:"user,omitempty"` // Minimal user data
	Replies []CommentWithUser `bson:"replies,omitempty" json:"replies,omitempty"`
}
