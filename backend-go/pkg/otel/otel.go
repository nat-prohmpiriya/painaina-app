package otel

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"backend-go/internal/config"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
)

// OtelManager manages all OpenTelemetry components (traces, metrics, logs)
type OtelManager struct {
	tracerProvider *trace.TracerProvider
	metricsManager *MetricsManager
	logger         *Logger
	config         *config.Config
}

// NewOtelManager creates and initializes a new OtelManager with all components
func NewOtelManager(cfg *config.Config) (*OtelManager, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config cannot be nil")
	}

	om := &OtelManager{
		config: cfg,
	}

	// Initialize Logger first (always enabled)
	logger, err := NewLogger(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create logger: %w", err)
	}
	om.logger = logger
	SetGlobalLogger(logger)
	log.Printf("  - Logging: level=%s, format=%s", cfg.OTEL.LogLevel, cfg.OTEL.LogFormat)

	// Initialize Metrics (if enabled)
	if cfg.OTEL.MetricsEnabled {
		mm, err := NewMetricsManager(cfg)
		if err != nil {
			return nil, fmt.Errorf("failed to create metrics manager: %w", err)
		}
		om.metricsManager = mm
	} else {
		log.Println("  - Metrics: disabled")
	}

	// Initialize Tracing
	if !cfg.OTEL.Enabled {
		log.Println("  - Tracing: disabled")
		om.tracerProvider = trace.NewTracerProvider()
		return om, nil
	}

	// Create OTLP HTTP exporter - always use OTEL_OTLP_ENDPOINT
	exporter, err := createOTLPExporter(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTLP exporter: %w", err)
	}

	// Create resource with service information
	res, err := resource.New(
		context.Background(),
		resource.WithAttributes(
			semconv.ServiceName(cfg.OTEL.ServiceName),
			semconv.ServiceVersion(cfg.Server.ServiceVersion),
			semconv.DeploymentEnvironmentName(cfg.Server.Environment),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	// Create trace provider with batch span processor
	om.tracerProvider = trace.NewTracerProvider(
		trace.WithBatcher(
			exporter,
			trace.WithBatchTimeout(time.Second*5),
			trace.WithMaxExportBatchSize(512),
		),
		trace.WithResource(res),
		trace.WithSampler(trace.AlwaysSample()),
	)

	return om, nil
}

// createOTLPExporter creates an OTLP HTTP exporter using OTEL_OTLP_ENDPOINT
func createOTLPExporter(cfg *config.Config) (trace.SpanExporter, error) {
	opts := []otlptracehttp.Option{
		otlptracehttp.WithEndpoint(cfg.OTEL.OTLPEndpoint),
		otlptracehttp.WithInsecure(),
	}

	// Parse headers if provided
	if cfg.OTEL.OTLPHeaders != "" {
		headers := parseHeaders(cfg.OTEL.OTLPHeaders)
		opts = append(opts, otlptracehttp.WithHeaders(headers))
	}

	exporter, err := otlptrace.New(
		context.Background(),
		otlptracehttp.NewClient(opts...),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTLP HTTP exporter: %w", err)
	}

	log.Printf("  - Tracing: OTLP endpoint=%s", cfg.OTEL.OTLPEndpoint)
	return exporter, nil
}

// Initialize sets up the global OpenTelemetry providers
func (om *OtelManager) Initialize() error {
	if om.tracerProvider == nil {
		return fmt.Errorf("tracer provider is not initialized")
	}

	// Set global trace provider
	otel.SetTracerProvider(om.tracerProvider)

	// Set global propagator for trace context propagation
	otel.SetTextMapPropagator(
		propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		),
	)

	log.Println("OpenTelemetry initialized successfully")
	return nil
}

// Shutdown gracefully shuts down all telemetry components
func (om *OtelManager) Shutdown(ctx context.Context) error {
	var errs []error

	if om.tracerProvider != nil {
		if err := om.tracerProvider.Shutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("tracer shutdown: %w", err))
		}
	}

	if om.metricsManager != nil {
		if err := om.metricsManager.Shutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("metrics shutdown: %w", err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("shutdown errors: %v", errs)
	}
	return nil
}

// GetTracerProvider returns the underlying trace provider
func (om *OtelManager) GetTracerProvider() *trace.TracerProvider {
	return om.tracerProvider
}

// GetMetricsManager returns the metrics manager
func (om *OtelManager) GetMetricsManager() *MetricsManager {
	return om.metricsManager
}

// GetLogger returns the logger
func (om *OtelManager) GetLogger() *Logger {
	return om.logger
}

// IsEnabled returns whether tracing is enabled
func (om *OtelManager) IsEnabled() bool {
	return om.config.OTEL.Enabled
}

// IsMetricsEnabled returns whether metrics is enabled
func (om *OtelManager) IsMetricsEnabled() bool {
	return om.config.OTEL.MetricsEnabled
}

// parseHeaders parses comma-separated key=value pairs into a map
func parseHeaders(headersStr string) map[string]string {
	headers := make(map[string]string)
	pairs := strings.Split(headersStr, ",")
	for _, pair := range pairs {
		parts := strings.SplitN(strings.TrimSpace(pair), "=", 2)
		if len(parts) == 2 {
			headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}
	return headers
}
