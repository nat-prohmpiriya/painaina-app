package handlers

import (
	"github.com/gin-gonic/gin"
)

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Status  string      `json:"status"`
	TraceID string      `json:"traceId"`
	Data    interface{} `json:"data"`
}

// ErrorResponse represents an error API response
type ErrorResponse struct {
	Status  string       `json:"status"`
	TraceID string       `json:"traceId"`
	Error   ErrorDetails `json:"error"`
}

// ErrorDetails contains error information
type ErrorDetails struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Success sends a success response
func Success(c *gin.Context, code int, data interface{}) {
	traceID, _ := c.Get("traceID")
	traceIDStr := ""
	if traceID != nil {
		traceIDStr = traceID.(string)
	}

	c.JSON(code, SuccessResponse{
		Status:  "success",
		TraceID: traceIDStr,
		Data:    data,
	})
}

// Error sends an error response
func Error(c *gin.Context, code int, message string) {
	traceID, _ := c.Get("traceID")
	traceIDStr := ""
	if traceID != nil {
		traceIDStr = traceID.(string)
	}

	c.JSON(code, ErrorResponse{
		Status:  "error",
		TraceID: traceIDStr,
		Error: ErrorDetails{
			Code:    code,
			Message: message,
		},
	})
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *gin.Context, message string) {
	Error(c, 400, message)
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *gin.Context, message string) {
	Error(c, 401, message)
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *gin.Context, message string) {
	Error(c, 403, message)
}

// NotFound sends a 404 Not Found response
func NotFound(c *gin.Context, message string) {
	Error(c, 404, message)
}

// InternalServerError sends a 500 Internal Server Error response
func InternalServerError(c *gin.Context, message string) {
	Error(c, 500, message)
}
