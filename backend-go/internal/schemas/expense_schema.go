package schemas

import (
	"time"

	"backend-go/internal/models"
)

type CreateExpenseRequest struct {
	EntryID      *string               `json:"entryId,omitempty"`
	Amount       float64               `json:"amount" binding:"required,min=0"`
	Currency     string                `json:"currency" binding:"required,len=3"`
	Category     string                `json:"category" binding:"required,oneof=accommodation food transportation activities shopping other"`
	Description  string                `json:"description" binding:"required,min=1,max=500"`
	PaidBy       string                `json:"paidBy" binding:"required"`
	SplitWith    []string              `json:"splitWith" binding:"required,min=1"`
	Date         time.Time             `json:"date" binding:"required"`
	SplitType    string                `json:"splitType" binding:"required,oneof=equal custom percentage"`
	SplitDetails []models.SplitDetail  `json:"splitDetails" binding:"required,min=1"`
}

type UpdateExpenseRequest struct {
	Amount       *float64              `json:"amount,omitempty" binding:"omitempty,min=0"`
	Currency     *string               `json:"currency,omitempty" binding:"omitempty,len=3"`
	Category     *string               `json:"category,omitempty" binding:"omitempty,oneof=accommodation food transportation activities shopping other"`
	Description  *string               `json:"description,omitempty" binding:"omitempty,min=1,max=500"`
	Date         *time.Time            `json:"date,omitempty"`
	SplitDetails *[]models.SplitDetail `json:"splitDetails,omitempty" binding:"omitempty,min=1"`
}
