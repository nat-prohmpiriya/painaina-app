package models

import (
	"github.com/kamva/mgm/v3"
)

// Base embeds mgm.DefaultModel which provides:
// - ID (primitive.ObjectID)
// - CreatedAt (time.Time)
// - UpdatedAt (time.Time)
// All models should embed this instead of defining their own timestamps
type Base struct {
	mgm.DefaultModel `bson:",inline"`
}
