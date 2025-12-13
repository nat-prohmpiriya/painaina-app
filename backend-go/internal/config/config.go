package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	MongoDB  MongoDBConfig
	Redis    RedisConfig
	Clerk    ClerkConfig
	R2       R2Config
	Google   GoogleConfig
	Unsplash UnsplashConfig
	OTEL     OTELConfig
	CORS     CORSConfig
}

type ServerConfig struct {
	Port           string
	GinMode        string
	ServiceName    string
	ServiceVersion string
	Environment    string
}

type MongoDBConfig struct {
	URI         string
	Database    string
	MaxPoolSize int
	Timeout     int
}

type RedisConfig struct {
	URL      string // For Upstash Redis (redis://...)
	Addr     string
	Password string
	DB       int
	Prefix   string // Key prefix for environment separation (e.g., "dev:", "prod:")
}

type ClerkConfig struct {
	SecretKey        string
	PublishableKey   string
	JWTIssuerDomain  string
}

type R2Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	Endpoint        string
	DevSubdomain    string
}

type GoogleConfig struct {
	PlacesAPIKey string
}

type UnsplashConfig struct{
	AccessKey string
	SecretKey string
}

type OTELConfig struct {
	Enabled      bool
	ExporterType string // "zipkin", "gcp", "otlp-http", "otlp-grpc", "stdout"
	ServiceName  string

	// Zipkin
	ZipkinEndpoint string

	// Google Cloud Trace
	GCPProjectID string

	// OTLP
	OTLPEndpoint string
	OTLPHeaders  string // comma-separated key=value pairs

	// Logging
	LogLevel       string // "debug", "info", "warn", "error"
	LogFormat      string // "json", "text"
	LogOTLPEnabled bool   // Enable OTLP log export

	// Metrics
	MetricsEnabled bool // Enable metrics collection and export via OTLP
}

type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := &Config{
		Server: ServerConfig{
			Port:           getEnv("PORT", "8080"),
			GinMode:        getEnv("GIN_MODE", "debug"),
			ServiceName:    getEnv("SERVICE_NAME", "trip-planner-api"),
			ServiceVersion: getEnv("SERVICE_VERSION", "1.0.0"),
			Environment:    getEnv("ENVIRONMENT", "development"),
		},
		MongoDB: MongoDBConfig{
			URI:         getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database:    getEnv("MONGODB_DATABASE", "travel_app"),
			MaxPoolSize: getEnvAsInt("MONGODB_MAX_POOL_SIZE", 100),
			Timeout:     getEnvAsInt("MONGODB_TIMEOUT", 10),
		},
		Redis: RedisConfig{
			URL:      getEnv("REDIS_URL", ""),
			Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
			Prefix:   getEnv("REDIS_PREFIX", "dev:"),
		},
		Clerk: ClerkConfig{
			SecretKey:        getEnv("CLERK_SECRET_KEY", ""),
			PublishableKey:   getEnv("CLERK_PUBLISHABLE_KEY", ""),
			JWTIssuerDomain:  getEnv("CLERK_JWT_ISSUER_DOMAIN", ""),
		},
		R2: R2Config{
			AccountID:       getEnv("R2_ACCOUNT_ID", ""),
			AccessKeyID:     getEnv("R2_ACCESS_KEY_ID", ""),
			SecretAccessKey: getEnv("R2_SECRET_ACCESS_KEY", ""),
			BucketName:      getEnv("R2_BUCKET_NAME", "travel-app-files"),
			Endpoint:        getEnv("R2_ENDPOINT", ""),
			DevSubdomain:    getEnv("R2_DEV_SUBDOMAIN", ""),
		},
		Google: GoogleConfig{
			PlacesAPIKey: getEnv("GOOGLE_PLACES_API_KEY", ""),
		},
		Unsplash: UnsplashConfig{
			AccessKey: getEnv("UNSPLASH_ACCESS_KEY", ""),
			SecretKey: getEnv("UNSPLASH_SECRET_KEY", ""),
		},
		OTEL: OTELConfig{
			Enabled:        getEnvAsBool("OTEL_ENABLED", true),
			ExporterType:   getEnv("OTEL_EXPORTER_TYPE", "zipkin"),
			ServiceName:    getEnv("OTEL_SERVICE_NAME", getEnv("SERVICE_NAME", "trip-planner-api")),
			ZipkinEndpoint: getEnv("OTEL_ZIPKIN_ENDPOINT", "http://localhost:9411/api/v2/spans"),
			GCPProjectID:   getEnv("OTEL_GCP_PROJECT_ID", ""),
			OTLPEndpoint:   getEnv("OTEL_OTLP_ENDPOINT", "http://localhost:4318"),
			OTLPHeaders:    getEnv("OTEL_OTLP_HEADERS", ""),
			// Logging
			LogLevel:       getEnv("OTEL_LOG_LEVEL", "info"),
			LogFormat:      getEnv("OTEL_LOG_FORMAT", "json"),
			LogOTLPEnabled: getEnvAsBool("OTEL_LOG_OTLP_ENABLED", false),
			// Metrics
			MetricsEnabled: getEnvAsBool("OTEL_METRICS_ENABLED", false),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"*"}),
			AllowedMethods: getEnvAsSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}),
			AllowedHeaders: getEnvAsSlice("CORS_ALLOWED_HEADERS", []string{"Content-Type", "Authorization"}),
		},
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}

	// Simple split by comma
	var result []string
	current := ""
	for _, char := range valueStr {
		if char == ',' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(char)
		}
	}
	if current != "" {
		result = append(result, current)
	}

	return result
}

// IsLocal returns true if the environment is local
func (c *Config) IsLocal() bool {
	return c.Server.Environment == "local" || c.Server.Environment == "development"
}
