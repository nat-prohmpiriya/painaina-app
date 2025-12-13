package middleware

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

// OTelMiddleware creates OpenTelemetry tracing middleware
func OTelMiddleware(serviceName string) gin.HandlerFunc {
	tracer := otel.Tracer("http-server")
	propagator := otel.GetTextMapPropagator()

	return func(c *gin.Context) {
		// Extract trace context from incoming headers (if exists)
		ctx := propagator.Extract(c.Request.Context(),
			propagation.HeaderCarrier(c.Request.Header))

		// Start new span (will create new trace if not exists)
		ctx, span := tracer.Start(ctx,
			fmt.Sprintf("%s %s", c.Request.Method, c.FullPath()),
			trace.WithSpanKind(trace.SpanKindServer))
		defer span.End()

		// Get trace ID from OpenTelemetry span context
		spanCtx := span.SpanContext()
		traceID := spanCtx.TraceID().String()

		// Inject to gin context for handlers
		c.Set("traceID", traceID)
		c.Set("span", span)

		// Add to response header for client correlation
		c.Header("X-Trace-ID", traceID)

		// Update request context with span
		c.Request = c.Request.WithContext(ctx)

		// Process request
		c.Next()

		// Set span attributes after request processing
		span.SetAttributes(
			attribute.Int("http.status_code", c.Writer.Status()),
			attribute.String("http.method", c.Request.Method),
			attribute.String("http.path", c.Request.URL.Path),
			attribute.String("http.user_agent", c.Request.UserAgent()),
			attribute.String("http.remote_addr", c.ClientIP()),
			attribute.String("service.name", serviceName),
		)

		// Add user ID if available
		if userID, exists := c.Get("userID"); exists {
			span.SetAttributes(attribute.String("user.id", userID.(string)))
		}

		// Record error if status >= 400
		if c.Writer.Status() >= 400 {
			span.SetAttributes(attribute.Bool("error", true))
		}
	}
}
