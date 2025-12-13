package otel

import (
	"context"
	"io"
	"log/slog"
	"os"

	"backend-go/internal/config"

	"go.opentelemetry.io/otel/trace"
)

// Logger wraps slog.Logger with trace correlation
type Logger struct {
	logger      *slog.Logger
	serviceName string
	environment string
}

// Global logger instance
var globalLogger *Logger

// NewLogger creates a new Logger with multiple outputs
func NewLogger(cfg *config.Config) (*Logger, error) {
	var level slog.Level
	switch cfg.OTEL.LogLevel {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level:     level,
		AddSource: true,
	}

	var handler slog.Handler

	// Choose format based on config
	if cfg.OTEL.LogFormat == "json" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	// Wrap with service context
	logger := slog.New(handler).With(
		slog.String("service", cfg.OTEL.ServiceName),
		slog.String("environment", cfg.Server.Environment),
	)

	return &Logger{
		logger:      logger,
		serviceName: cfg.OTEL.ServiceName,
		environment: cfg.Server.Environment,
	}, nil
}

// SetGlobalLogger sets the global logger instance
func SetGlobalLogger(l *Logger) {
	globalLogger = l
	// Also set as default slog logger
	if l != nil {
		slog.SetDefault(l.logger)
	}
}

// GetLogger returns the global logger
func GetLogger() *Logger {
	return globalLogger
}

// WithContext returns a logger with trace context
func (l *Logger) WithContext(ctx context.Context) *slog.Logger {
	if l == nil || l.logger == nil {
		return slog.Default()
	}

	spanCtx := trace.SpanContextFromContext(ctx)

	if spanCtx.IsValid() {
		return l.logger.With(
			slog.String("trace_id", spanCtx.TraceID().String()),
			slog.String("span_id", spanCtx.SpanID().String()),
		)
	}

	return l.logger
}

// L returns a context-aware logger (shorthand)
func L(ctx context.Context) *slog.Logger {
	if globalLogger == nil {
		return slog.Default()
	}
	return globalLogger.WithContext(ctx)
}

// WithFields returns a logger with additional fields
func (l *Logger) WithFields(args ...any) *Logger {
	if l == nil {
		return nil
	}
	return &Logger{
		logger:      l.logger.With(args...),
		serviceName: l.serviceName,
		environment: l.environment,
	}
}

// Debug logs a debug message
func (l *Logger) Debug(msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.logger.Debug(msg, args...)
}

// Info logs an info message
func (l *Logger) Info(msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.logger.Info(msg, args...)
}

// Warn logs a warning message
func (l *Logger) Warn(msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.logger.Warn(msg, args...)
}

// Error logs an error message
func (l *Logger) Error(msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.logger.Error(msg, args...)
}

// GetSlogLogger returns the underlying slog.Logger
func (l *Logger) GetSlogLogger() *slog.Logger {
	if l == nil {
		return slog.Default()
	}
	return l.logger
}

// MultiHandler combines multiple slog handlers
type MultiHandler struct {
	handlers []slog.Handler
}

// NewMultiHandler creates a handler that writes to multiple handlers
func NewMultiHandler(handlers ...slog.Handler) *MultiHandler {
	return &MultiHandler{handlers: handlers}
}

// Enabled returns true if any handler is enabled for the level
func (h *MultiHandler) Enabled(ctx context.Context, level slog.Level) bool {
	for _, handler := range h.handlers {
		if handler.Enabled(ctx, level) {
			return true
		}
	}
	return false
}

// Handle writes the record to all handlers
func (h *MultiHandler) Handle(ctx context.Context, r slog.Record) error {
	for _, handler := range h.handlers {
		if handler.Enabled(ctx, r.Level) {
			if err := handler.Handle(ctx, r); err != nil {
				return err
			}
		}
	}
	return nil
}

// WithAttrs returns a new MultiHandler with the given attributes
func (h *MultiHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	handlers := make([]slog.Handler, len(h.handlers))
	for i, handler := range h.handlers {
		handlers[i] = handler.WithAttrs(attrs)
	}
	return &MultiHandler{handlers: handlers}
}

// WithGroup returns a new MultiHandler with the given group
func (h *MultiHandler) WithGroup(name string) slog.Handler {
	handlers := make([]slog.Handler, len(h.handlers))
	for i, handler := range h.handlers {
		handlers[i] = handler.WithGroup(name)
	}
	return &MultiHandler{handlers: handlers}
}

// NullWriter discards all writes
type NullWriter struct{}

func (NullWriter) Write(p []byte) (n int, err error) {
	return len(p), nil
}

var _ io.Writer = NullWriter{}
