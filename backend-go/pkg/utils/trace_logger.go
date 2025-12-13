package utils

import (
	"context"
	"encoding/json"
	"fmt"

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
type TraceLogger struct {
	span trace.Span
	ctx  context.Context
}

// NewTraceLogger creates a new TraceLogger instance
func NewTraceLogger(ctx context.Context, span trace.Span) *TraceLogger {
	return &TraceLogger{
		span: span,
		ctx:  ctx,
	}
}

// addContextAttributes automatically injects context attributes (traceID, userID, userRole) into the span
func (t *TraceLogger) addContextAttributes() {
	traceID, userID, userRole, err := GetContextValue(t.ctx)
	if err != nil {
		// If traceID is missing, we still try to get userID and userRole directly
		if userIDVal := t.ctx.Value("userID"); userIDVal != nil {
			if userIDStr, ok := userIDVal.(string); ok {
				userID = userIDStr
			} else {
				userID = "anonymous"
			}
		} else {
			userID = "anonymous"
		}

		if userRoleVal := t.ctx.Value("userRole"); userRoleVal != nil {
			if userRoleStr, ok := userRoleVal.(string); ok {
				userRole = userRoleStr
			} else {
				userRole = "guest"
			}
		} else {
			userRole = "guest"
		}

		traceID = "" // Empty string for missing traceID
	}

	t.span.SetAttributes(
		attribute.String("traceID", traceID),
		attribute.String("userID", userID),
		attribute.String("userRole", userRole),
	)
}

// Input logs input data with context attributes
func (t *TraceLogger) Input(data interface{}) {
	t.addContextAttributes()
	t.span.AddEvent(fmt.Sprintf("input # %s", ToJSONString(data)))
}

// Output logs output data with context attributes
func (t *TraceLogger) Output(data interface{}) {
	t.addContextAttributes()
	t.span.AddEvent(fmt.Sprintf("output # %s", ToJSONString(data)))
}

// Warn logs warning messages with context attributes
func (t *TraceLogger) Warn(message string) {
	t.addContextAttributes()
	t.span.AddEvent(fmt.Sprintf("warn # %s", message))
}

// Info logs informational messages with context attributes
func (t *TraceLogger) Info(message string) {
	t.addContextAttributes()
	t.span.AddEvent(fmt.Sprintf("info # %s", message))
}

// Error logs error messages and records the error in the span
func (t *TraceLogger) Error(err error) {
	t.addContextAttributes()
	t.span.RecordError(err)
	t.span.AddEvent(fmt.Sprintf("error # %s", err.Error()))
}
