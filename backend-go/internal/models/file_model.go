package models

import (
	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// File represents a file uploaded by users
type File struct {
	mgm.DefaultModel `bson:",inline"`

	OwnerID  primitive.ObjectID `bson:"owner_id" json:"ownerId"`
	URL      string             `bson:"url" json:"url"`
	Type     string             `bson:"type" json:"type"` // photo, document, video
	Size     int64              `bson:"size" json:"size"`
	Metadata map[string]string  `bson:"metadata,omitempty" json:"metadata,omitempty"`
}

// Constants for File type
const (
	FileTypePhoto    = "photo"
	FileTypeDocument = "document"
	FileTypeVideo    = "video"
)

// CollectionName returns the collection name for File
func (f *File) CollectionName() string {
	return "files"
}
