#!/bin/bash

# Health Check Script for Microservices AI Platform
# This script checks the health of all services

set -e

echo "🏥 Health Check for Microservices AI Platform..."

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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Configuration
NAMESPACE=${K8S_NAMESPACE:-"microservices-ai-platform"}
TIMEOUT=10

# Function to check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" | grep -q "$expected_status"; then
        print_success "$name is healthy"
        return 0
    else
        print_error "$name is unhealthy"
        return 1
    fi
}

# Function to check Kubernetes pod
check_k8s_pod() {
    local app_name=$1
    
    if kubectl get pods -n "$NAMESPACE" -l app="$app_name" --no-headers | grep -q "Running"; then
        local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app="$app_name" --no-headers | grep "Running" | wc -l)
        print_success "$app_name: $ready_pods pod(s) running"
        return 0
    else
        print_error "$app_name: No running pods found"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    local db_name=$1
    local host=$2
    local port=$3
    
    if nc -z -w$TIMEOUT "$host" "$port" 2>/dev/null; then
        print_success "$db_name database is reachable"
        return 0
    else
        print_error "$db_name database is unreachable"
        return 1
    fi
}

# Determine if running in Kubernetes or Docker Compose
if kubectl cluster-info &>/dev/null && kubectl get namespace "$NAMESPACE" &>/dev/null; then
    DEPLOYMENT_TYPE="kubernetes"
    print_status "Detected Kubernetes deployment"
else
    DEPLOYMENT_TYPE="docker"
    print_status "Detected Docker Compose deployment"
fi

# Health check counters
total_checks=0
passed_checks=0

echo ""
print_status "=== Infrastructure Health Check ==="

if [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
    # Kubernetes health checks
    services=("postgres" "mongodb" "redis" "kafka" "elasticsearch")
    for service in "${services[@]}"; do
        total_checks=$((total_checks + 1))
        if check_k8s_pod "$service"; then
            passed_checks=$((passed_checks + 1))
        fi
    done
else
    # Docker Compose health checks
    databases=(
        "PostgreSQL:localhost:5432"
        "MongoDB:localhost:27017"
        "Redis:localhost:6379"
        "Kafka:localhost:9092"
        "Elasticsearch:localhost:9200"
    )
    
    for db_info in "${databases[@]}"; do
        IFS=':' read -r name host port <<< "$db_info"
        total_checks=$((total_checks + 1))
        if check_database "$name" "$host" "$port"; then
            passed_checks=$((passed_checks + 1))
        fi
    done
fi

echo ""
print_status "=== Microservices Health Check ==="

if [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
    # Kubernetes microservices health checks
    microservices=("api-gateway" "user-service" "data-service" "ai-ml-service" "notification-service" "frontend")
    for service in "${microservices[@]}"; do
        total_checks=$((total_checks + 1))
        if check_k8s_pod "$service"; then
            passed_checks=$((passed_checks + 1))
        fi
    done
else
    # Docker Compose microservices health checks
    endpoints=(
        "API Gateway:http://localhost:8080/actuator/health"
        "User Service:http://localhost:8081/actuator/health"
        "Data Service:http://localhost:8082/actuator/health"
        "AI/ML Service:http://localhost:8083/health"
        "Notification Service:http://localhost:8084/health"
        "Frontend:http://localhost:3000"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r name url <<< "$endpoint_info"
        total_checks=$((total_checks + 1))
        if check_http_endpoint "$name" "$url"; then
            passed_checks=$((passed_checks + 1))
        fi
    done
fi

echo ""
print_status "=== Monitoring Health Check ==="

if [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
    monitoring_services=("prometheus" "grafana")
    for service in "${monitoring_services[@]}"; do
        total_checks=$((total_checks + 1))
        if check_k8s_pod "$service"; then
            passed_checks=$((passed_checks + 1))
        fi
    done
else
    monitoring_endpoints=(
        "Prometheus:http://localhost:9090/-/healthy"
        "Grafana:http://localhost:3001/api/health"
    )
    
    for endpoint_info in "${monitoring_endpoints[@]}"; do
        IFS=':' read -r name url <<< "$endpoint_info"
        total_checks=$((total_checks + 1))
        if check_http_endpoint "$name" "$url"; then
            passed_checks=$((passed_checks + 1))
        fi
    done
fi

# Summary
echo ""
print_status "=== Health Check Summary ==="
echo "Total checks: $total_checks"
echo "Passed: $passed_checks"
echo "Failed: $((total_checks - passed_checks))"

if [ $passed_checks -eq $total_checks ]; then
    print_success "🎉 All services are healthy!"
    exit 0
elif [ $passed_checks -gt $((total_checks / 2)) ]; then
    print_warning "⚠️  Some services are unhealthy, but system is partially operational"
    exit 1
else
    print_error "❌ System is unhealthy - multiple services are down"
    exit 2
fi