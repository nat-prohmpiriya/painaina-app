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
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/exporters/zipkin"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"

	texporter "github.com/GoogleCloudPlatform/opentelemetry-operations-go/exporter/trace"
)

// OtelManager manages OpenTelemetry tracing configuration
type OtelManager struct {
	tracerProvider *trace.TracerProvider
	config         *config.Config
}

// NewOtelManager creates and initializes a new OtelManager with auto-switch between environments
func NewOtelManager(cfg *config.Config) (*OtelManager, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config cannot be nil")
	}

	if !cfg.OTEL.Enabled {
		log.Println("OpenTelemetry tracing is disabled")
		// Return a no-op tracer provider when tracing is disabled
		return &OtelManager{
			tracerProvider: trace.NewTracerProvider(),
			config:         cfg,
		}, nil
	}

	// Auto-switch exporter based on environment
	var exporter trace.SpanExporter
	var err error

	if cfg.IsLocal() {
		// Use Zipkin for local development
		log.Println("Environment is local/development, using Zipkin exporter")
		exporter, err = zipkin.New(cfg.OTEL.ZipkinEndpoint)
		if err != nil {
			return nil, fmt.Errorf("failed to create Zipkin exporter: %w", err)
		}
		log.Printf("  └─ Zipkin endpoint: %s", cfg.OTEL.ZipkinEndpoint)
	} else {
		// Use configured exporter type for non-local environments
		switch strings.ToLower(cfg.OTEL.ExporterType) {
		case "zipkin":
			exporter, err = createZipkinExporter(cfg)
		case "gcp", "google-cloud-trace":
			exporter, err = createGCPExporter(cfg)
		case "otlp-http":
			exporter, err = createOTLPHTTPExporter(cfg)
		case "otlp-grpc":
			exporter, err = createOTLPGRPCExporter(cfg)
		case "stdout":
			exporter, err = createStdoutExporter()
		default:
			log.Printf("Unknown exporter type '%s', falling back to GCP Trace", cfg.OTEL.ExporterType)
			exporter, err = createGCPExporter(cfg)
		}

		if err != nil {
			return nil, fmt.Errorf("failed to create exporter: %w", err)
		}
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
	traceProvider := trace.NewTracerProvider(
		trace.WithBatcher(
			exporter,
			trace.WithBatchTimeout(time.Second*5),
			trace.WithMaxExportBatchSize(512),
		),
		trace.WithResource(res),
		trace.WithSampler(trace.AlwaysSample()),
	)

	return &OtelManager{
		tracerProvider: traceProvider,
		config:         cfg,
	}, nil
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

	log.Printf("✓ OpenTelemetry initialized successfully")
	return nil
}

// Shutdown gracefully shuts down the telemetry manager
func (om *OtelManager) Shutdown(ctx context.Context) error {
	if om.tracerProvider == nil {
		return nil
	}
	return om.tracerProvider.Shutdown(ctx)
}

// GetTracerProvider returns the underlying trace provider
func (om *OtelManager) GetTracerProvider() *trace.TracerProvider {
	return om.tracerProvider
}

// IsEnabled returns whether telemetry is enabled
func (om *OtelManager) IsEnabled() bool {
	return om.config.OTEL.Enabled
}

// InitTracer is a convenience function that creates and initializes OtelManager
// Deprecated: Use NewOtelManager and Initialize separately for better control
func InitTracer(cfg *config.Config) (func(context.Context) error, error) {
	om, err := NewOtelManager(cfg)
	if err != nil {
		return nil, err
	}

	if err := om.Initialize(); err != nil {
		return nil, err
	}

	return om.Shutdown, nil
}

// createZipkinExporter creates a Zipkin exporter
func createZipkinExporter(cfg *config.Config) (trace.SpanExporter, error) {
	exporter, err := zipkin.New(cfg.OTEL.ZipkinEndpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to create Zipkin exporter: %w", err)
	}
	log.Printf("  └─ Zipkin endpoint: %s", cfg.OTEL.ZipkinEndpoint)
	return exporter, nil
}

// createGCPExporter creates a Google Cloud Trace exporter
func createGCPExporter(cfg *config.Config) (trace.SpanExporter, error) {
	if cfg.OTEL.GCPProjectID == "" {
		return nil, fmt.Errorf("GCP project ID is required for Google Cloud Trace exporter")
	}

	exporter, err := texporter.New(texporter.WithProjectID(cfg.OTEL.GCPProjectID))
	if err != nil {
		return nil, fmt.Errorf("failed to create GCP exporter: %w", err)
	}
	log.Printf("  └─ GCP project ID: %s", cfg.OTEL.GCPProjectID)
	return exporter, nil
}

// createOTLPHTTPExporter creates an OTLP HTTP exporter
func createOTLPHTTPExporter(cfg *config.Config) (trace.SpanExporter, error) {
	opts := []otlptracehttp.Option{
		otlptracehttp.WithEndpoint(cfg.OTEL.OTLPEndpoint),
		otlptracehttp.WithInsecure(), // Use WithTLSClientConfig for production
	}

	// Parse headers
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
	log.Printf("  └─ OTLP HTTP endpoint: %s", cfg.OTEL.OTLPEndpoint)
	return exporter, nil
}

// createOTLPGRPCExporter creates an OTLP gRPC exporter
func createOTLPGRPCExporter(cfg *config.Config) (trace.SpanExporter, error) {
	opts := []otlptracegrpc.Option{
		otlptracegrpc.WithEndpoint(cfg.OTEL.OTLPEndpoint),
		otlptracegrpc.WithInsecure(), // Use WithTLSCredentials for production
	}

	// Parse headers
	if cfg.OTEL.OTLPHeaders != "" {
		headers := parseHeaders(cfg.OTEL.OTLPHeaders)
		opts = append(opts, otlptracegrpc.WithHeaders(headers))
	}

	exporter, err := otlptrace.New(
		context.Background(),
		otlptracegrpc.NewClient(opts...),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTLP gRPC exporter: %w", err)
	}
	log.Printf("  └─ OTLP gRPC endpoint: %s", cfg.OTEL.OTLPEndpoint)
	return exporter, nil
}

// createStdoutExporter creates a stdout exporter (for debugging)
func createStdoutExporter() (trace.SpanExporter, error) {
	exporter, err := stdouttrace.New(
		stdouttrace.WithPrettyPrint(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout exporter: %w", err)
	}
	log.Println("  └─ Exporting to stdout (debug mode)")
	return exporter, nil
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
