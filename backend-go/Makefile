.PHONY: help run build test clean install dev

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

run: ## Run the application
	@echo "Running application..."
	go run cmd/api/main.go

dev: ## Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
	@echo "Running with hot reload..."
	air

build: ## Build the application
	@echo "Building application..."
	go build -o bin/api cmd/api/main.go

test: ## Run tests
	@echo "Running tests..."
	go test -v ./...

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf bin/
	rm -rf tmp/
	rm -f coverage.out coverage.html

lint: ## Run linter (requires golangci-lint)
	@echo "Running linter..."
	golangci-lint run

fmt: ## Format code
	@echo "Formatting code..."
	go fmt ./...

docker-build: ## Build docker image
	@echo "Building docker image..."
	docker build -t trip-planner-api:latest .

docker-run: ## Run docker container
	@echo "Running docker container..."
	docker run -p 8080:8080 --env-file .env trip-planner-api:latest
