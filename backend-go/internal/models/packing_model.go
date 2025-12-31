package models

import (
	"time"

	"github.com/kamva/mgm/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PackingCategory represents packing item categories
type PackingCategory string

const (
	PackingCategoryClothing    PackingCategory = "clothing"
	PackingCategoryToiletries  PackingCategory = "toiletries"
	PackingCategoryElectronics PackingCategory = "electronics"
	PackingCategoryDocuments   PackingCategory = "documents"
	PackingCategoryMedicine    PackingCategory = "medicine"
	PackingCategoryAccessories PackingCategory = "accessories"
	PackingCategoryFood        PackingCategory = "food"
	PackingCategoryOther       PackingCategory = "other"
)

// PackingItem represents a single item in the packing list
type PackingItem struct {
	ID         primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Name       string              `bson:"name" json:"name"`
	Category   PackingCategory     `bson:"category" json:"category"`
	Quantity   int                 `bson:"quantity" json:"quantity"`
	Packed     bool                `bson:"packed" json:"packed"`
	AssignedTo *primitive.ObjectID `bson:"assigned_to,omitempty" json:"assignedTo,omitempty"`
	Notes      string              `bson:"notes,omitempty" json:"notes,omitempty"`
	Order      int                 `bson:"order" json:"order"`
	CreatedAt  time.Time           `bson:"created_at" json:"createdAt"`
	UpdatedAt  time.Time           `bson:"updated_at" json:"updatedAt"`
}

// PackingList represents a trip's packing list
type PackingList struct {
	mgm.DefaultModel `bson:",inline"`
	TripID           primitive.ObjectID `bson:"trip_id" json:"tripId"`
	Items            []PackingItem      `bson:"items" json:"items"`
}

// CollectionName returns the collection name for PackingList
func (p *PackingList) CollectionName() string {
	return "packing_lists"
}

// Creating hook to set default values
func (p *PackingList) Creating() error {
	if p.Items == nil {
		p.Items = []PackingItem{}
	}
	return nil
}

// AddItem adds a new item to the packing list
func (p *PackingList) AddItem(item PackingItem) {
	if item.ID.IsZero() {
		item.ID = primitive.NewObjectID()
	}
	now := time.Now()
	item.CreatedAt = now
	item.UpdatedAt = now
	p.Items = append(p.Items, item)
}

// UpdateItem updates an existing item in the packing list
func (p *PackingList) UpdateItem(itemID primitive.ObjectID, updates map[string]interface{}) bool {
	for i, item := range p.Items {
		if item.ID == itemID {
			if name, ok := updates["name"].(string); ok {
				p.Items[i].Name = name
			}
			if category, ok := updates["category"].(PackingCategory); ok {
				p.Items[i].Category = category
			}
			if quantity, ok := updates["quantity"].(int); ok {
				p.Items[i].Quantity = quantity
			}
			if packed, ok := updates["packed"].(bool); ok {
				p.Items[i].Packed = packed
			}
			if assignedTo, ok := updates["assignedTo"].(*primitive.ObjectID); ok {
				p.Items[i].AssignedTo = assignedTo
			}
			if notes, ok := updates["notes"].(string); ok {
				p.Items[i].Notes = notes
			}
			if order, ok := updates["order"].(int); ok {
				p.Items[i].Order = order
			}
			p.Items[i].UpdatedAt = time.Now()
			return true
		}
	}
	return false
}

// RemoveItem removes an item from the packing list
func (p *PackingList) RemoveItem(itemID primitive.ObjectID) bool {
	for i, item := range p.Items {
		if item.ID == itemID {
			p.Items = append(p.Items[:i], p.Items[i+1:]...)
			return true
		}
	}
	return false
}

// ToggleItemPacked toggles the packed status of an item
func (p *PackingList) ToggleItemPacked(itemID primitive.ObjectID) bool {
	for i, item := range p.Items {
		if item.ID == itemID {
			p.Items[i].Packed = !p.Items[i].Packed
			p.Items[i].UpdatedAt = time.Now()
			return true
		}
	}
	return false
}

// GetPackingStats returns packing statistics
func (p *PackingList) GetPackingStats() map[string]interface{} {
	totalItems := len(p.Items)
	packedItems := 0
	byCategory := make(map[PackingCategory]int)
	packedByCategory := make(map[PackingCategory]int)

	for _, item := range p.Items {
		byCategory[item.Category]++
		if item.Packed {
			packedItems++
			packedByCategory[item.Category]++
		}
	}

	return map[string]interface{}{
		"totalItems":       totalItems,
		"packedItems":      packedItems,
		"byCategory":       byCategory,
		"packedByCategory": packedByCategory,
	}
}

// ReorderItems reorders items based on provided IDs order
func (p *PackingList) ReorderItems(itemIDs []primitive.ObjectID) bool {
	if len(itemIDs) != len(p.Items) {
		return false
	}

	// Create a map of current items
	itemMap := make(map[primitive.ObjectID]PackingItem)
	for _, item := range p.Items {
		itemMap[item.ID] = item
	}

	// Reorder items
	newItems := make([]PackingItem, 0, len(itemIDs))
	for i, id := range itemIDs {
		if item, ok := itemMap[id]; ok {
			item.Order = i
			item.UpdatedAt = time.Now()
			newItems = append(newItems, item)
		} else {
			return false
		}
	}

	p.Items = newItems
	return true
}
