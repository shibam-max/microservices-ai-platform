#!/bin/bash

# Build All Services Script for Microservices AI Platform
# Demonstrates CI/CD and build automation for XYZ Dev Foundation

set -e

echo "🚀 Building Microservices AI Platform..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Java
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed or not in PATH"
        exit 1
    fi
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        print_error "Maven is not installed or not in PATH"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        print_error "Python is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed - skipping containerization"
    fi
    
    print_status "Prerequisites check completed ✅"
}

# Build Java services
build_java_services() {
    print_status "Building Java services..."
    
    cd "$(dirname "$0")/.."
    
    # Build parent POM first
    print_status "Building parent POM..."
    mvn clean install -N
    
    # Build API Gateway
    print_status "Building API Gateway..."
    cd services/api-gateway
    mvn clean package -DskipTests
    cd ../..
    
    # Build User Service
    print_status "Building User Service..."
    cd services/user-service
    mvn clean package -DskipTests
    cd ../..
    
    # Build Data Service
    print_status "Building Data Service..."
    cd services/data-service
    mvn clean package -DskipTests
    cd ../..
    
    print_status "Java services built successfully ✅"
}

# Build Python AI/ML service
build_python_service() {
    print_status "Building AI/ML Service (Python)..."
    
    cd services/ai-ml-service
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate || source venv/Scripts/activate
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run basic syntax check
    print_status "Running Python syntax check..."
    python -m py_compile app/main.py
    
    deactivate
    cd ../..
    
    print_status "AI/ML Service built successfully ✅"
}

# Build Node.js service
build_nodejs_service() {
    print_status "Building Notification Service (Node.js)..."
    
    cd services/notification-service
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Run linting if available
    if npm run lint --silent 2>/dev/null; then
        print_status "Running ESLint..."
        npm run lint
    fi
    
    cd ../..
    
    print_status "Notification Service built successfully ✅"
}

# Build React frontend
build_frontend() {
    print_status "Building React Frontend..."
    
    cd frontend/react-app
    
    # Install dependencies
    print_status "Installing React dependencies..."
    npm install
    
    # Build for production
    print_status "Building React app for production..."
    npm run build
    
    cd ../..
    
    print_status "React Frontend built successfully ✅"
}

# Build Docker images
build_docker_images() {
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not available - skipping image builds"
        return
    fi
    
    print_status "Building Docker images..."
    
    # Build API Gateway image
    print_status "Building API Gateway Docker image..."
    cd services/api-gateway
    docker build -t microservices-ai-platform/api-gateway:latest .
    cd ../..
    
    # Build User Service image
    print_status "Building User Service Docker image..."
    cd services/user-service
    docker build -t microservices-ai-platform/user-service:latest .
    cd ../..
    
    # Build Data Service image
    print_status "Building Data Service Docker image..."
    cd services/data-service
    docker build -t microservices-ai-platform/data-service:latest .
    cd ../..
    
    # Build AI/ML Service image
    print_status "Building AI/ML Service Docker image..."
    cd services/ai-ml-service
    docker build -t microservices-ai-platform/ai-ml-service:latest .
    cd ../..
    
    # Build Notification Service image
    print_status "Building Notification Service Docker image..."
    cd services/notification-service
    docker build -t microservices-ai-platform/notification-service:latest .
    cd ../..
    
    # Build Frontend image
    print_status "Building Frontend Docker image..."
    cd frontend/react-app
    docker build -t microservices-ai-platform/frontend:latest .
    cd ../..
    
    print_status "Docker images built successfully ✅"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Java tests
    print_status "Running Java tests..."
    cd services/user-service
    mvn test
    cd ../..
    
    # Python tests (if test files exist)
    if [ -f "services/ai-ml-service/tests/test_main.py" ]; then
        print_status "Running Python tests..."
        cd services/ai-ml-service
        source venv/bin/activate || source venv/Scripts/activate
        python -m pytest tests/
        deactivate
        cd ../..
    fi
    
    # Node.js tests (if available)
    cd services/notification-service
    if npm run test --silent 2>/dev/null; then
        print_status "Running Node.js tests..."
        npm test
    fi
    cd ../..
    
    print_status "Tests completed ✅"
}

# Generate build report
generate_report() {
    print_status "Generating build report..."
    
    REPORT_FILE="build-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Microservices AI Platform - Build Report"
        echo "========================================"
        echo "Build Date: $(date)"
        echo "Build Host: $(hostname)"
        echo ""
        echo "Services Built:"
        echo "- API Gateway (Java Spring Boot)"
        echo "- User Service (Java Spring Boot)"
        echo "- Data Service (Java Spring Boot)"
        echo "- AI/ML Service (Python FastAPI)"
        echo "- Notification Service (Node.js Express)"
        echo "- Frontend (React)"
        echo ""
        echo "Technologies Used:"
        echo "- Java $(java -version 2>&1 | head -n 1)"
        echo "- Maven $(mvn -version | head -n 1)"
        echo "- Node.js $(node --version)"
        echo "- Python $(python3 --version 2>/dev/null || python --version)"
        echo ""
        if command -v docker &> /dev/null; then
            echo "Docker Images:"
            docker images | grep microservices-ai-platform
        fi
    } > "$REPORT_FILE"
    
    print_status "Build report generated: $REPORT_FILE ✅"
}

# Main execution
main() {
    echo "Starting build process..."
    
    check_prerequisites
    build_java_services
    build_python_service
    build_nodejs_service
    build_frontend
    
    if [ "$1" = "--with-docker" ]; then
        build_docker_images
    fi
    
    if [ "$1" = "--with-tests" ]; then
        run_tests
    fi
    
    generate_report
    
    echo ""
    print_status "🎉 Build completed successfully!"
    echo "========================================"
    echo "All services have been built and are ready for deployment."
    echo ""
    echo "Next steps:"
    echo "1. Start infrastructure: docker-compose -f infrastructure/docker-compose.yml up -d"
    echo "2. Deploy services: ./scripts/deploy.sh"
    echo "3. Access frontend: http://localhost:3000"
    echo "4. Access API Gateway: http://localhost:8080"
}

# Execute main function
main "$@"