package otel

import (
	"context"
	"io"
	"log"
	"log/slog"
	"os"

	"backend-go/internal/config"

	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	otellog "go.opentelemetry.io/otel/log"
	"go.opentelemetry.io/otel/log/global"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
	"go.opentelemetry.io/otel/trace"
)

// Logger wraps slog.Logger with trace correlation and OTLP export
type Logger struct {
	logger         *slog.Logger
	loggerProvider *sdklog.LoggerProvider
	otelLogger     otellog.Logger
	serviceName    string
	environment    string
	otlpEnabled    bool
}

// Global logger instance
var globalLogger *Logger

// NewLogger creates a new Logger with multiple outputs and optional OTLP export
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

	l := &Logger{
		logger:      logger,
		serviceName: cfg.OTEL.ServiceName,
		environment: cfg.Server.Environment,
		otlpEnabled: cfg.OTEL.LogOTLPEnabled,
	}

	// Initialize OTLP log exporter if enabled
	if cfg.OTEL.LogOTLPEnabled && cfg.OTEL.OTLPEndpoint != "" {
		ctx := context.Background()

		// Create OTLP HTTP log exporter
		exporter, err := otlploghttp.New(ctx,
			otlploghttp.WithEndpoint(cfg.OTEL.OTLPEndpoint),
			otlploghttp.WithInsecure(),
		)
		if err != nil {
			log.Printf("⚠️  Failed to create OTLP log exporter: %v", err)
		} else {
			// Create resource
			res, err := resource.New(ctx,
				resource.WithAttributes(
					semconv.ServiceName(cfg.OTEL.ServiceName),
					semconv.ServiceVersion(cfg.Server.ServiceVersion),
					semconv.DeploymentEnvironmentName(cfg.Server.Environment),
				),
			)
			if err != nil {
				log.Printf("⚠️  Failed to create log resource: %v", err)
			} else {
				// Create logger provider
				l.loggerProvider = sdklog.NewLoggerProvider(
					sdklog.WithResource(res),
					sdklog.WithProcessor(sdklog.NewBatchProcessor(exporter)),
				)

				// Set global logger provider
				global.SetLoggerProvider(l.loggerProvider)

				// Get logger instance
				l.otelLogger = l.loggerProvider.Logger(cfg.OTEL.ServiceName)

				log.Printf("  - Logs: OTLP enabled (endpoint: %s)", cfg.OTEL.OTLPEndpoint)
			}
		}
	}

	return l, nil
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
	l.emitOTLP(context.Background(), otellog.SeverityDebug, msg, args...)
}

// Info logs an info message
func (l *Logger) Info(msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.logger.Info(msg, args...)
	l.emitOTLP(context.Background(), otellog.SeverityInfo, msg, args...)
}

// Warn logs a warning message
func (l *Logger) Warn(msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.logger.Warn(msg, args...)
	l.emitOTLP(context.Background(), otellog.SeverityWarn, msg, args...)
}

// Error logs an error message
func (l *Logger) Error(msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.logger.Error(msg, args...)
	l.emitOTLP(context.Background(), otellog.SeverityError, msg, args...)
}

// DebugContext logs a debug message with context (for trace correlation)
func (l *Logger) DebugContext(ctx context.Context, msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.WithContext(ctx).Debug(msg, args...)
	l.emitOTLP(ctx, otellog.SeverityDebug, msg, args...)
}

// InfoContext logs an info message with context (for trace correlation)
func (l *Logger) InfoContext(ctx context.Context, msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.WithContext(ctx).Info(msg, args...)
	l.emitOTLP(ctx, otellog.SeverityInfo, msg, args...)
}

// WarnContext logs a warning message with context (for trace correlation)
func (l *Logger) WarnContext(ctx context.Context, msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.WithContext(ctx).Warn(msg, args...)
	l.emitOTLP(ctx, otellog.SeverityWarn, msg, args...)
}

// ErrorContext logs an error message with context (for trace correlation)
func (l *Logger) ErrorContext(ctx context.Context, msg string, args ...any) {
	if l == nil || l.logger == nil {
		return
	}
	l.WithContext(ctx).Error(msg, args...)
	l.emitOTLP(ctx, otellog.SeverityError, msg, args...)
}

// emitOTLP sends log to OTLP exporter
func (l *Logger) emitOTLP(ctx context.Context, severity otellog.Severity, msg string, args ...any) {
	if l == nil || !l.otlpEnabled || l.otelLogger == nil {
		return
	}

	var record otellog.Record
	record.SetBody(otellog.StringValue(msg))
	record.SetSeverity(severity)

	// Add trace context if available
	spanCtx := trace.SpanContextFromContext(ctx)
	if spanCtx.IsValid() {
		record.AddAttributes(
			otellog.String("trace_id", spanCtx.TraceID().String()),
			otellog.String("span_id", spanCtx.SpanID().String()),
		)
	}

	// Add additional attributes from args
	for i := 0; i < len(args)-1; i += 2 {
		if key, ok := args[i].(string); ok {
			switch v := args[i+1].(type) {
			case string:
				record.AddAttributes(otellog.String(key, v))
			case int:
				record.AddAttributes(otellog.Int(key, v))
			case int64:
				record.AddAttributes(otellog.Int64(key, v))
			case float64:
				record.AddAttributes(otellog.Float64(key, v))
			case bool:
				record.AddAttributes(otellog.Bool(key, v))
			}
		}
	}

	l.otelLogger.Emit(ctx, record)
}

// Shutdown gracefully shuts down the logger provider
func (l *Logger) Shutdown(ctx context.Context) error {
	if l == nil || l.loggerProvider == nil {
		return nil
	}
	return l.loggerProvider.Shutdown(ctx)
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
