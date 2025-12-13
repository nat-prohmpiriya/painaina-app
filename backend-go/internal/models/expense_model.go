package models

import (
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Expense represents a trip expense
type Expense struct {
	mgm.DefaultModel `bson:",inline"`

	TripID       primitive.ObjectID   `bson:"trip_id" json:"tripId"`
	EntryID      *primitive.ObjectID  `bson:"entry_id,omitempty" json:"entryId,omitempty"` // Optional: link to itinerary entry
	Amount       float64              `bson:"amount" json:"amount"`
	Currency     string               `bson:"currency" json:"currency"`                   // THB, USD, etc.
	Category     ExpenseCategory      `bson:"category" json:"category"`                   // food, transport, etc.
	Description  string               `bson:"description" json:"description"`
	PaidBy       primitive.ObjectID   `bson:"paid_by" json:"paidBy"`                      // User who paid
	SplitWith    []primitive.ObjectID `bson:"split_with" json:"splitWith"`                // Users to split with
	Date         time.Time            `bson:"date" json:"date"`
	SplitType    SplitType            `bson:"split_type" json:"splitType"`                // equal, custom, percentage
	SplitDetails []SplitDetail        `bson:"split_details,omitempty" json:"splitDetails,omitempty"` // Embedded split details
	Status       ExpenseStatus        `bson:"status" json:"status"`                       // pending, confirmed
}

// ExpenseCategory represents expense categories
type ExpenseCategory string

const (
	CategoryFood          ExpenseCategory = "food"
	CategoryTransport     ExpenseCategory = "transport"
	CategoryAccommodation ExpenseCategory = "accommodation"
	CategoryActivity      ExpenseCategory = "activity"
	CategoryShopping      ExpenseCategory = "shopping"
	CategoryOther         ExpenseCategory = "other"
)

// SplitType represents how expense is split
type SplitType string

const (
	SplitTypeEqual      SplitType = "equal"
	SplitTypeCustom     SplitType = "custom"
	SplitTypePercentage SplitType = "percentage"
)

// ExpenseStatus represents expense status
type ExpenseStatus string

const (
	ExpenseStatusPending   ExpenseStatus = "pending"
	ExpenseStatusConfirmed ExpenseStatus = "confirmed"
	ExpenseStatusSettled   ExpenseStatus = "settled"
)

// SplitDetail represents embedded split information for each user
type SplitDetail struct {
	UserID primitive.ObjectID `bson:"user_id" json:"userId"`
	Amount float64            `bson:"amount" json:"amount"` // Amount this user owes
}

// CollectionName returns the collection name for Expense
func (e *Expense) CollectionName() string {
	return "expenses"
}

// Creating hook to calculate split details if not provided
func (e *Expense) Creating() error {
	// Set default status
	if e.Status == "" {
		e.Status = ExpenseStatusPending
	}

	// Auto-calculate equal split if split details not provided
	if len(e.SplitDetails) == 0 && e.SplitType == SplitTypeEqual && len(e.SplitWith) > 0 {
		perPerson := e.Amount / float64(len(e.SplitWith))
		for _, userID := range e.SplitWith {
			e.SplitDetails = append(e.SplitDetails, SplitDetail{
				UserID: userID,
				Amount: perPerson,
			})
		}
	}

	return nil
}

// GetTotalOwed returns total amount owed by a specific user
func (e *Expense) GetTotalOwed(userID primitive.ObjectID) float64 {
	for _, detail := range e.SplitDetails {
		if detail.UserID == userID {
			return detail.Amount
		}
	}
	return 0
}

// MarkAsConfirmed marks the expense as confirmed
func (e *Expense) MarkAsConfirmed() {
	e.Status = ExpenseStatusConfirmed
}
