package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NotificationType string

const (
	NotificationTypeTripInvite   NotificationType = "trip_invite"
	NotificationTypeComment      NotificationType = "comment"
	NotificationTypeCommentReply NotificationType = "comment_reply"
	NotificationTypeMemberJoined NotificationType = "member_joined"
	NotificationTypeLike         NotificationType = "like"
)

type Notification struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RecipientID string             `bson:"recipient_id" json:"recipientId"`
	SenderID    string             `bson:"sender_id" json:"senderId"`
	Type        NotificationType   `bson:"type" json:"type"`
	ReferenceID string             `bson:"reference_id" json:"referenceId"` // trip_id, comment_id, etc.
	Message     string             `bson:"message" json:"message"`
	IsRead      bool               `bson:"is_read" json:"isRead"`
	CreatedAt   time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`

	// Populated fields (not stored in DB)
	Sender *User `bson:"-" json:"sender,omitempty"`
}
