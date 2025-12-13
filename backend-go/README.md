# Trip Planner API

Go backend API for travel planning application built with Gin framework.

## Tech Stack

- **Backend**: Golang + Gin Framework
- **Database**: MongoDB + Redis
- **Storage**: Cloudflare R2
- **Authentication**: Clerk
- **Monitoring**: OpenTelemetry + Zipkin
- **External APIs**: Google Places, Unsplash

## Project Structure

```
backend-go/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                  # Configuration management
│   ├── models/                  # Data models
│   ├── handlers/                # HTTP request handlers
│   ├── services/                # Business logic
│   ├── repository/              # Database layer
│   └── middleware/              # HTTP middleware
├── pkg/
│   ├── mongodb/                 # MongoDB client
│   ├── redis/                   # Redis client
│   ├── clerk/                   # Clerk authentication
│   ├── r2/                      # Cloudflare R2 storage
│   ├── googleplaces/            # Google Places API
│   ├── unsplash/                # Unsplash API
│   └── utils/                   # Utility functions
├── .env.example                 # Environment variables template
├── go.mod                       # Go module definition
└── Makefile                     # Build commands
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- Docker & Docker Compose (for running Zipkin and optional services)
- MongoDB (cloud or local)
- Redis (cloud or local)
- Clerk account
- Google Places API key
- Unsplash API key

### Development Setup

#### Option 1: Local Development (with Air hot reload)

1. **Install Air for hot reload:**
   ```bash
   go install github.com/cosmtrek/air@latest
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Run development server:**
   ```bash
   ./rundev.sh
   # or
   make dev
   ```

#### Option 2: Docker Development

1. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

2. **Run with Docker Compose (includes Zipkin):**
   ```bash
   docker-compose up
   ```

   This will start:
   - Backend API on port 5001 (with hot reload)
   - Zipkin on port 9411 (for distributed tracing)

3. **Run only Zipkin (if you want to run API locally):**
   ```bash
   docker-compose up zipkin
   ```

#### Option 3: Local without Docker

1. **Install dependencies:**
   ```bash
   make install
   ```

2. **Run the application:**
   ```bash
   make run
   ```
- Cloudflare R2 account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend-go
```

2. Install dependencies
```bash
make install
```

3. Copy environment variables
```bash
cp .env.example .env
```

4. Update `.env` with your credentials

5. Run the application
```bash
make run
```

The API will be available at `http://localhost:8080`

## Available Commands

```bash
make help           # Show all available commands
make install        # Install dependencies
make run           # Run the application
make dev           # Run with hot reload (requires air)
make build         # Build the application
make test          # Run tests
make test-coverage # Run tests with coverage
make clean         # Clean build artifacts
make lint          # Run linter
make fmt           # Format code
```

## API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Response Format

**Success Response:**
```json
{
    "status": "success",
    "trace_id": "abc123def456",
    "data": {
        "key": "value"
    }
}
```

**Error Response:**
```json
{
    "status": "error",
    "trace_id": "abc123def456",
    "error": {
        "code": 400,
        "message": "Bad Request"
    }
}
```

### Endpoints

#### Health Check
- `GET /health` - Check API health status

#### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user
- `DELETE /api/v1/users/me` - Delete current user

#### Trips
- `GET /api/v1/trips` - List trips
- `GET /api/v1/trips/:id` - Get trip details
- `POST /api/v1/trips` - Create trip
- `PATCH /api/v1/trips/:id` - Update trip
- `DELETE /api/v1/trips/:id` - Delete trip

#### Places
- `GET /api/v1/places/autocomplete` - Autocomplete places
- `GET /api/v1/places/search` - Search places
- `GET /api/v1/places/:id` - Get place details

#### Files
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/:id` - Get file

## Monitoring & Tracing

This API uses OpenTelemetry for distributed tracing. Every request includes a `trace_id` in the response that can be used to track the request through all services.

### Viewing Traces

1. Start Zipkin (optional):
```bash
docker run -d -p 9411:9411 openzipkin/zipkin
```

2. View traces at `http://localhost:9411`

## Environment Variables

See `.env.example` for all available configuration options.

## Development

### Running Tests
```bash
make test
```

### Code Formatting
```bash
make fmt
```

### Running Linter
```bash
make lint
```

## License

MIT
