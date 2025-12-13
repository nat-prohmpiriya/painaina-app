package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"backend-go/pkg/otel"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// ToJSONString marshals any interface to a JSON string
// Returns error message if marshaling fails
func ToJSONString(v interface{}) string {
	jsonBytes, err := json.Marshal(v)
	if err != nil {
		return fmt.Sprintf("error: %v", err)
	}
	return string(jsonBytes)
}

// TraceLogger provides structured logging with OpenTelemetry integration
// REFACTORED: Now uses slog instead of span events for proper log/trace separation
type TraceLogger struct {
	span   trace.Span
	ctx    context.Context
	logger *slog.Logger
}

// NewTraceLogger creates a new TraceLogger instance
func NewTraceLogger(ctx context.Context, span trace.Span) *TraceLogger {
	// Get context-aware logger with trace correlation
	logger := otel.L(ctx)

	// Add user context if available
	userID := "anonymous"
	userRole := "guest"

	if userIDVal := ctx.Value("userID"); userIDVal != nil {
		if userIDStr, ok := userIDVal.(string); ok && userIDStr != "" {
			userID = userIDStr
		}
	}

	if userRoleVal := ctx.Value("userRole"); userRoleVal != nil {
		if userRoleStr, ok := userRoleVal.(string); ok && userRoleStr != "" {
			userRole = userRoleStr
		}
	}

	logger = logger.With(
		slog.String("user_id", userID),
		slog.String("user_role", userRole),
	)

	// Set span attributes for trace context
	span.SetAttributes(
		attribute.String("user.id", userID),
		attribute.String("user.role", userRole),
	)

	return &TraceLogger{
		span:   span,
		ctx:    ctx,
		logger: logger,
	}
}

// Input logs input data
func (t *TraceLogger) Input(data interface{}) {
	t.logger.Info("input", slog.Any("data", data))
	// Add minimal span attribute for trace debugging
	t.span.SetAttributes(attribute.String("input.type", fmt.Sprintf("%T", data)))
}

// Output logs output data
func (t *TraceLogger) Output(data interface{}) {
	t.logger.Info("output", slog.Any("data", data))
	// Add minimal span attribute for trace debugging
	t.span.SetAttributes(attribute.String("output.type", fmt.Sprintf("%T", data)))
}

// Warn logs warning messages
func (t *TraceLogger) Warn(message string) {
	t.logger.Warn(message)
}

// Info logs informational messages
func (t *TraceLogger) Info(message string) {
	t.logger.Info(message)
}

// Error logs error messages and records the error in the span
func (t *TraceLogger) Error(err error) {
	t.logger.Error("error occurred", slog.String("error", err.Error()))
	// Still record error in span for trace visibility
	t.span.RecordError(err)
}

// Debug logs debug messages (new method)
func (t *TraceLogger) Debug(message string, args ...any) {
	t.logger.Debug(message, args...)
}

// With returns a logger with additional attributes
func (t *TraceLogger) With(args ...any) *TraceLogger {
	return &TraceLogger{
		span:   t.span,
		ctx:    t.ctx,
		logger: t.logger.With(args...),
	}
}

// InfoWithData logs info message with structured data
func (t *TraceLogger) InfoWithData(message string, data interface{}) {
	t.logger.Info(message, slog.Any("data", data))
}

// WarnWithData logs warning message with structured data
func (t *TraceLogger) WarnWithData(message string, data interface{}) {
	t.logger.Warn(message, slog.Any("data", data))
}

// ErrorWithData logs error with additional context data
func (t *TraceLogger) ErrorWithData(err error, data interface{}) {
	t.logger.Error("error occurred",
		slog.String("error", err.Error()),
		slog.Any("context", data),
	)
	t.span.RecordError(err)
}
