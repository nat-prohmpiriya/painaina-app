package services

import (
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/internal/schemas"
	"backend-go/pkg/utils"
)

type PackingService struct {
	packingRepo *repository.PackingRepository
	tracer      trace.Tracer
}

func NewPackingService() *PackingService {
	return &PackingService{
		packingRepo: repository.NewPackingRepository(),
		tracer:      otel.Tracer("packing-service"),
	}
}

// GetPackingList gets the packing list for a trip
func (s *PackingService) GetPackingList(ctx context.Context, tripID string) (*models.PackingList, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.GetPackingList")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	packingList, err := s.packingRepo.FindOrCreateByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"itemCount": len(packingList.Items),
	})
	return packingList, nil
}

// AddItem adds an item to the packing list
func (s *PackingService) AddItem(ctx context.Context, tripID string, req schemas.CreatePackingItemRequest) (*models.PackingList, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.AddItem")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":   tripID,
		"name":     req.Name,
		"category": req.Category,
		"quantity": req.Quantity,
	})

	packingList, err := s.packingRepo.FindOrCreateByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Create new item
	item := models.PackingItem{
		Name:     req.Name,
		Category: models.PackingCategory(req.Category),
		Quantity: req.Quantity,
		Packed:   false,
		Order:    len(packingList.Items),
	}

	if req.Notes != nil {
		item.Notes = *req.Notes
	}

	if req.AssignedTo != nil && *req.AssignedTo != "" {
		assignedToID, err := primitive.ObjectIDFromHex(*req.AssignedTo)
		if err != nil {
			logger.Error(err)
			return nil, errors.New("invalid assignedTo user ID")
		}
		item.AssignedTo = &assignedToID
	}

	packingList.AddItem(item)

	err = s.packingRepo.Update(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"newItemCount": len(packingList.Items),
	})
	return packingList, nil
}

// UpdateItem updates an item in the packing list
func (s *PackingService) UpdateItem(ctx context.Context, tripID, itemID string, req schemas.UpdatePackingItemRequest) (*models.PackingList, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.UpdateItem")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"itemID": itemID,
	})

	packingList, err := s.packingRepo.FindByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		logger.Error(err)
		return nil, errors.New("invalid item ID")
	}

	// Build updates map
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Category != nil {
		updates["category"] = models.PackingCategory(*req.Category)
	}
	if req.Quantity != nil {
		updates["quantity"] = *req.Quantity
	}
	if req.Packed != nil {
		updates["packed"] = *req.Packed
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}
	if req.AssignedTo != nil {
		if *req.AssignedTo == "" {
			updates["assignedTo"] = (*primitive.ObjectID)(nil)
		} else {
			assignedToID, err := primitive.ObjectIDFromHex(*req.AssignedTo)
			if err != nil {
				logger.Error(err)
				return nil, errors.New("invalid assignedTo user ID")
			}
			updates["assignedTo"] = &assignedToID
		}
	}

	if !packingList.UpdateItem(itemObjID, updates) {
		return nil, errors.New("item not found")
	}

	err = s.packingRepo.Update(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Info("Item updated successfully")
	return packingList, nil
}

// DeleteItem deletes an item from the packing list
func (s *PackingService) DeleteItem(ctx context.Context, tripID, itemID string) (*models.PackingList, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.DeleteItem")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"itemID": itemID,
	})

	packingList, err := s.packingRepo.FindByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		logger.Error(err)
		return nil, errors.New("invalid item ID")
	}

	if !packingList.RemoveItem(itemObjID) {
		return nil, errors.New("item not found")
	}

	err = s.packingRepo.Update(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Info("Item deleted successfully")
	return packingList, nil
}

// ToggleItemPacked toggles the packed status of an item
func (s *PackingService) ToggleItemPacked(ctx context.Context, tripID, itemID string) (*models.PackingList, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.ToggleItemPacked")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
		"itemID": itemID,
	})

	packingList, err := s.packingRepo.FindByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	itemObjID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		logger.Error(err)
		return nil, errors.New("invalid item ID")
	}

	if !packingList.ToggleItemPacked(itemObjID) {
		return nil, errors.New("item not found")
	}

	err = s.packingRepo.Update(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Info("Item packed status toggled")
	return packingList, nil
}

// ReorderItems reorders items in the packing list
func (s *PackingService) ReorderItems(ctx context.Context, tripID string, itemIDs []string) (*models.PackingList, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.ReorderItems")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":    tripID,
		"itemCount": len(itemIDs),
	})

	packingList, err := s.packingRepo.FindByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Convert string IDs to ObjectIDs
	objectIDs := make([]primitive.ObjectID, len(itemIDs))
	for i, id := range itemIDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error(err)
			return nil, errors.New("invalid item ID in reorder list")
		}
		objectIDs[i] = objID
	}

	if !packingList.ReorderItems(objectIDs) {
		return nil, errors.New("failed to reorder items")
	}

	err = s.packingRepo.Update(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Info("Items reordered successfully")
	return packingList, nil
}

// ApplyTemplate applies a packing template to the packing list
func (s *PackingService) ApplyTemplate(ctx context.Context, tripID, templateID string) (*models.PackingList, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.ApplyTemplate")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID":     tripID,
		"templateID": templateID,
	})

	// Find the template
	templates := schemas.GetPackingTemplates()
	var template *schemas.PackingTemplate
	for _, t := range templates {
		if t.ID == templateID {
			template = &t
			break
		}
	}

	if template == nil {
		return nil, errors.New("template not found")
	}

	packingList, err := s.packingRepo.FindOrCreateByTripID(ctx, tripID)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	// Add items from template
	for _, templateItem := range template.Items {
		item := models.PackingItem{
			Name:     templateItem.Name,
			Category: models.PackingCategory(templateItem.Category),
			Quantity: templateItem.Quantity,
			Packed:   false,
			Order:    len(packingList.Items),
		}
		packingList.AddItem(item)
	}

	err = s.packingRepo.Update(ctx, packingList)
	if err != nil {
		logger.Error(err)
		return nil, err
	}

	logger.Output(map[string]interface{}{
		"addedItems":   len(template.Items),
		"newItemCount": len(packingList.Items),
	})
	return packingList, nil
}

// GetTemplates returns all available packing templates
func (s *PackingService) GetTemplates() []schemas.PackingTemplate {
	return schemas.GetPackingTemplates()
}

// GetPackingStats returns packing statistics for a trip
func (s *PackingService) GetPackingStats(ctx context.Context, tripID string) (map[string]interface{}, error) {
	ctx, span := s.tracer.Start(ctx, "PackingService.GetPackingStats")
	defer span.End()
	logger := utils.NewTraceLogger(ctx, span)

	logger.Input(map[string]interface{}{
		"tripID": tripID,
	})

	packingList, err := s.packingRepo.FindByTripID(ctx, tripID)
	if err != nil {
		// Return empty stats if no packing list exists
		return map[string]interface{}{
			"totalItems":       0,
			"packedItems":      0,
			"byCategory":       map[string]int{},
			"packedByCategory": map[string]int{},
		}, nil
	}

	stats := packingList.GetPackingStats()
	logger.Output(stats)
	return stats, nil
}
