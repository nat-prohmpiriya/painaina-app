package otel

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend-go/internal/config"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
)

// MetricsManager manages OpenTelemetry metrics
type MetricsManager struct {
	meterProvider *sdkmetric.MeterProvider
	meter         metric.Meter
	config        *config.Config

	// HTTP Metrics
	httpRequestsTotal   metric.Int64Counter
	httpRequestDuration metric.Float64Histogram
	httpActiveRequests  metric.Int64UpDownCounter

	// Business Metrics
	tripsCreatedTotal    metric.Int64Counter
	tripsDeletedTotal    metric.Int64Counter
	expensesCreatedTotal metric.Int64Counter
	usersRegisteredTotal metric.Int64Counter
	authFailuresTotal    metric.Int64Counter
	filesUploadedTotal   metric.Int64Counter
}

// NewMetricsManager creates and initializes a new MetricsManager with OTLP export
func NewMetricsManager(cfg *config.Config) (*MetricsManager, error) {
	if !cfg.OTEL.MetricsEnabled {
		log.Println("OpenTelemetry metrics is disabled")
		return nil, nil
	}

	ctx := context.Background()

	// Create OTLP HTTP exporter for metrics
	exporter, err := otlpmetrichttp.New(ctx,
		otlpmetrichttp.WithEndpoint(cfg.OTEL.OTLPEndpoint),
		otlpmetrichttp.WithInsecure(), // Use WithTLSClientConfig for production with TLS
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTLP metric exporter: %w", err)
	}

	// Create resource with service information
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(cfg.OTEL.ServiceName),
			semconv.ServiceVersion(cfg.Server.ServiceVersion),
			semconv.DeploymentEnvironmentName(cfg.Server.Environment),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	// Create meter provider with periodic reader
	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithResource(res),
		sdkmetric.WithReader(
			sdkmetric.NewPeriodicReader(
				exporter,
				sdkmetric.WithInterval(15*time.Second), // Export every 15 seconds
			),
		),
	)

	// Set global meter provider
	otel.SetMeterProvider(meterProvider)

	meter := meterProvider.Meter(cfg.OTEL.ServiceName)

	mm := &MetricsManager{
		meterProvider: meterProvider,
		meter:         meter,
		config:        cfg,
	}

	// Initialize all metrics
	if err := mm.initHTTPMetrics(); err != nil {
		return nil, fmt.Errorf("failed to init HTTP metrics: %w", err)
	}
	if err := mm.initBusinessMetrics(); err != nil {
		return nil, fmt.Errorf("failed to init business metrics: %w", err)
	}

	log.Printf("  - Metrics: enabled (OTLP endpoint: %s)", cfg.OTEL.OTLPEndpoint)
	return mm, nil
}

// initHTTPMetrics initializes HTTP-related metrics
func (mm *MetricsManager) initHTTPMetrics() error {
	var err error

	mm.httpRequestsTotal, err = mm.meter.Int64Counter(
		"http_requests_total",
		metric.WithDescription("Total number of HTTP requests"),
		metric.WithUnit("{request}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create http_requests_total: %w", err)
	}

	mm.httpRequestDuration, err = mm.meter.Float64Histogram(
		"http_request_duration_seconds",
		metric.WithDescription("HTTP request latency in seconds"),
		metric.WithUnit("s"),
		metric.WithExplicitBucketBoundaries(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
	)
	if err != nil {
		return fmt.Errorf("failed to create http_request_duration_seconds: %w", err)
	}

	mm.httpActiveRequests, err = mm.meter.Int64UpDownCounter(
		"http_active_requests",
		metric.WithDescription("Number of active HTTP requests"),
		metric.WithUnit("{request}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create http_active_requests: %w", err)
	}

	return nil
}

// initBusinessMetrics initializes business-related metrics
func (mm *MetricsManager) initBusinessMetrics() error {
	var err error

	mm.tripsCreatedTotal, err = mm.meter.Int64Counter(
		"trips_created_total",
		metric.WithDescription("Total number of trips created"),
		metric.WithUnit("{trip}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create trips_created_total: %w", err)
	}

	mm.tripsDeletedTotal, err = mm.meter.Int64Counter(
		"trips_deleted_total",
		metric.WithDescription("Total number of trips deleted"),
		metric.WithUnit("{trip}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create trips_deleted_total: %w", err)
	}

	mm.expensesCreatedTotal, err = mm.meter.Int64Counter(
		"expenses_created_total",
		metric.WithDescription("Total number of expenses created"),
		metric.WithUnit("{expense}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create expenses_created_total: %w", err)
	}

	mm.usersRegisteredTotal, err = mm.meter.Int64Counter(
		"users_registered_total",
		metric.WithDescription("Total number of users registered"),
		metric.WithUnit("{user}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create users_registered_total: %w", err)
	}

	mm.authFailuresTotal, err = mm.meter.Int64Counter(
		"auth_failures_total",
		metric.WithDescription("Total number of authentication failures"),
		metric.WithUnit("{failure}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create auth_failures_total: %w", err)
	}

	mm.filesUploadedTotal, err = mm.meter.Int64Counter(
		"files_uploaded_total",
		metric.WithDescription("Total number of files uploaded"),
		metric.WithUnit("{file}"),
	)
	if err != nil {
		return fmt.Errorf("failed to create files_uploaded_total: %w", err)
	}

	return nil
}

// RecordHTTPRequest records HTTP request metrics
func (mm *MetricsManager) RecordHTTPRequest(ctx context.Context, method, path string, statusCode int, duration time.Duration) {
	if mm == nil {
		return
	}

	attrs := []attribute.KeyValue{
		attribute.String("http.method", method),
		attribute.String("http.route", path),
		attribute.Int("http.status_code", statusCode),
	}

	mm.httpRequestsTotal.Add(ctx, 1, metric.WithAttributes(attrs...))
	mm.httpRequestDuration.Record(ctx, duration.Seconds(), metric.WithAttributes(attrs...))
}

// IncrementActiveRequests increments the active request counter
func (mm *MetricsManager) IncrementActiveRequests(ctx context.Context) {
	if mm == nil {
		return
	}
	mm.httpActiveRequests.Add(ctx, 1)
}

// DecrementActiveRequests decrements the active request counter
func (mm *MetricsManager) DecrementActiveRequests(ctx context.Context) {
	if mm == nil {
		return
	}
	mm.httpActiveRequests.Add(ctx, -1)
}

// IncrementTripsCreated increments the trips created counter
func (mm *MetricsManager) IncrementTripsCreated(ctx context.Context) {
	if mm == nil {
		return
	}
	mm.tripsCreatedTotal.Add(ctx, 1)
}

// IncrementTripsDeleted increments the trips deleted counter
func (mm *MetricsManager) IncrementTripsDeleted(ctx context.Context) {
	if mm == nil {
		return
	}
	mm.tripsDeletedTotal.Add(ctx, 1)
}

// IncrementExpensesCreated increments the expenses created counter
func (mm *MetricsManager) IncrementExpensesCreated(ctx context.Context, tripID string) {
	if mm == nil {
		return
	}
	mm.expensesCreatedTotal.Add(ctx, 1, metric.WithAttributes(
		attribute.String("trip_id", tripID),
	))
}

// IncrementUsersRegistered increments the users registered counter
func (mm *MetricsManager) IncrementUsersRegistered(ctx context.Context) {
	if mm == nil {
		return
	}
	mm.usersRegisteredTotal.Add(ctx, 1)
}

// IncrementAuthFailures increments the auth failures counter
func (mm *MetricsManager) IncrementAuthFailures(ctx context.Context, reason string) {
	if mm == nil {
		return
	}
	mm.authFailuresTotal.Add(ctx, 1, metric.WithAttributes(
		attribute.String("reason", reason),
	))
}

// IncrementFilesUploaded increments the files uploaded counter
func (mm *MetricsManager) IncrementFilesUploaded(ctx context.Context, fileType string) {
	if mm == nil {
		return
	}
	mm.filesUploadedTotal.Add(ctx, 1, metric.WithAttributes(
		attribute.String("file_type", fileType),
	))
}

// Shutdown gracefully shuts down the metrics manager
func (mm *MetricsManager) Shutdown(ctx context.Context) error {
	if mm == nil || mm.meterProvider == nil {
		return nil
	}
	return mm.meterProvider.Shutdown(ctx)
}
