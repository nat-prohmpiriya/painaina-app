#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Backend Development Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo -e "${YELLOW}   Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}   Please update the values in .env before continuing${NC}"
    exit 1
fi

# Check if Air is installed
if ! command -v air &> /dev/null; then
    echo -e "${YELLOW}⚠️  Air not found! Installing...${NC}"
    go install github.com/cosmtrek/air@latest
    echo -e "${GREEN}✓ Air installed${NC}"
    echo ""
fi

# Check if go.mod dependencies are installed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
go mod download
go mod tidy
echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Create tmp directory if it doesn't exist
mkdir -p tmp

# Start development server with Air
echo -e "${BLUE}🚀 Starting development server with hot reload...${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop${NC}"
echo ""

air
