#!/bin/bash

# Build and Push Docker Images Script
# This script builds all Docker images and pushes them to the registry

set -e

echo "🐳 Building and pushing Docker images for Microservices AI Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
REGISTRY=${DOCKER_REGISTRY:-"microservices-ai-platform"}
TAG=${IMAGE_TAG:-"latest"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is running"

# Build Java services
build_java_service() {
    local service_name=$1
    local service_path="$PROJECT_ROOT/services/$service_name"
    
    print_status "Building $service_name..."
    
    cd "$service_path"
    
    # Build with Maven
    if [ -f "pom.xml" ]; then
        mvn clean package -DskipTests
        print_success "Maven build completed for $service_name"
    fi
    
    # Build Docker image
    docker build -t "$REGISTRY/$service_name:$TAG" .
    print_success "Docker image built: $REGISTRY/$service_name:$TAG"
    
    # Push to registry
    docker push "$REGISTRY/$service_name:$TAG"
    print_success "Image pushed: $REGISTRY/$service_name:$TAG"
    
    cd "$PROJECT_ROOT"
}

# Build Python service
build_python_service() {
    local service_name=$1
    local service_path="$PROJECT_ROOT/services/$service_name"
    
    print_status "Building $service_name..."
    
    cd "$service_path"
    
    # Build Docker image
    docker build -t "$REGISTRY/$service_name:$TAG" .
    print_success "Docker image built: $REGISTRY/$service_name:$TAG"
    
    # Push to registry
    docker push "$REGISTRY/$service_name:$TAG"
    print_success "Image pushed: $REGISTRY/$service_name:$TAG"
    
    cd "$PROJECT_ROOT"
}

# Build Node.js service
build_nodejs_service() {
    local service_name=$1
    local service_path="$PROJECT_ROOT/services/$service_name"
    
    print_status "Building $service_name..."
    
    cd "$service_path"
    
    # Install dependencies
    npm ci
    print_success "Dependencies installed for $service_name"
    
    # Build Docker image
    docker build -t "$REGISTRY/$service_name:$TAG" .
    print_success "Docker image built: $REGISTRY/$service_name:$TAG"
    
    # Push to registry
    docker push "$REGISTRY/$service_name:$TAG"
    print_success "Image pushed: $REGISTRY/$service_name:$TAG"
    
    cd "$PROJECT_ROOT"
}

# Build React frontend
build_frontend() {
    local frontend_path="$PROJECT_ROOT/frontend/react-app"
    
    print_status "Building frontend..."
    
    cd "$frontend_path"
    
    # Install dependencies
    npm ci
    print_success "Dependencies installed for frontend"
    
    # Build production bundle
    npm run build
    print_success "Frontend build completed"
    
    # Build Docker image
    docker build -t "$REGISTRY/frontend:$TAG" .
    print_success "Docker image built: $REGISTRY/frontend:$TAG"
    
    # Push to registry
    docker push "$REGISTRY/frontend:$TAG"
    print_success "Image pushed: $REGISTRY/frontend:$TAG"
    
    cd "$PROJECT_ROOT"
}

# Main build process
print_status "Starting build process..."

# Build Java services
build_java_service "api-gateway"
build_java_service "user-service"
build_java_service "data-service"

# Build Python service
build_python_service "ai-ml-service"

# Build Node.js service
build_nodejs_service "notification-service"

# Build React frontend
build_frontend

# Display built images
print_status "Built images:"
docker images | grep "$REGISTRY"

print_success "🎉 All images built and pushed successfully!"
print_status "Images are ready for deployment with tag: $TAG"

# Optional: Clean up local images to save space
read -p "Do you want to clean up local images to save space? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleaning up local images..."
    docker images | grep "$REGISTRY" | awk '{print $3}' | xargs docker rmi -f
    print_success "Local images cleaned up"
fi

print_success "Build and push process completed! 🚀"