package services

import (
	"context"
	"fmt"

	"backend-go/internal/models"
	"backend-go/internal/repository"
	"backend-go/pkg/sse"
)

type NotificationService struct {
	repo     *repository.NotificationRepository
	userRepo *repository.UserRepository
	sseHub   *sse.Hub
}

func NewNotificationService(repo *repository.NotificationRepository, userRepo *repository.UserRepository, sseHub *sse.Hub) *NotificationService {
	return &NotificationService{
		repo:     repo,
		userRepo: userRepo,
		sseHub:   sseHub,
	}
}

func (s *NotificationService) CreateNotification(ctx context.Context, recipientID, senderID, referenceID string, notifType models.NotificationType, message string) error {
	notification := &models.Notification{
		RecipientID: recipientID,
		SenderID:    senderID,
		Type:        notifType,
		ReferenceID: referenceID,
		Message:     message,
	}

	// Save to MongoDB
	err := s.repo.Create(ctx, notification)
	if err != nil {
		return err
	}

	// Broadcast notification via SSE
	if s.sseHub != nil {
		s.sseHub.BroadcastNotification(recipientID)
	}

	return nil
}

func (s *NotificationService) GetNotifications(ctx context.Context, userID string, limit, offset int) ([]*models.Notification, error) {
	notifications, err := s.repo.GetByUserID(ctx, userID, limit, offset)
	if err != nil {
		return nil, err
	}

	// Populate sender information
	for _, notif := range notifications {
		if notif.SenderID != "" {
			sender, err := s.userRepo.FindByClerkID(ctx, notif.SenderID)
			if err == nil && sender != nil {
				notif.Sender = sender
			}
		}
	}

	return notifications, nil
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID string) (int64, error) {
	return s.repo.GetUnreadCount(ctx, userID)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID, userID string) error {
	// Verify notification belongs to user
	notification, err := s.repo.GetByID(ctx, notificationID)
	if err != nil {
		return err
	}

	if notification.RecipientID != userID {
		return fmt.Errorf("unauthorized: notification does not belong to user")
	}

	return s.repo.MarkAsRead(ctx, notificationID)
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}
