package utils

import (
	"context"
	"errors"
)

// GetContextValue extracts traceID, userID, and userRole from context
// Returns defaults for missing values: "anonymous" for userID, "guest" for userRole
func GetContextValue(ctx context.Context) (string, string, string, error) {
	// Extract traceID - this is required
	traceID, ok := ctx.Value("traceID").(string)
	if !ok {
		return "", "", "", errors.New("traceID not found in context")
	}

	// Extract userID - default to "anonymous" if not found
	userID, ok := ctx.Value("userID").(string)
	if !ok {
		userID = "anonymous"
	}

	// Extract userRole - default to "guest" if not found
	userRole, ok := ctx.Value("userRole").(string)
	if !ok {
		userRole = "guest"
	}

	return traceID, userID, userRole, nil
}

// GetStringFromContext extracts a string value from context by key
func GetStringFromContext(ctx context.Context, key string) (string, error) {
	value, ok := ctx.Value(key).(string)
	if !ok {
		return "", errors.New(key + " not found in context")
	}
	return value, nil
}
