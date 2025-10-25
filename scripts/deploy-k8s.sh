#!/bin/bash

# Kubernetes Deployment Script for Microservices AI Platform
# This script deploys the complete platform to Kubernetes

set -e

echo "🚀 Starting Kubernetes deployment for Microservices AI Platform..."

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if we can connect to Kubernetes cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_success "Connected to Kubernetes cluster"

# Set the deployment directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR/../infrastructure/k8s"

# Create namespace
print_status "Creating namespace..."
kubectl apply -f "$K8S_DIR/namespace.yaml"
print_success "Namespace created"

# Apply RBAC and security policies
print_status "Applying RBAC and security policies..."
kubectl apply -f "$K8S_DIR/rbac.yaml"
kubectl apply -f "$K8S_DIR/pod-security-policy.yaml"
print_success "Security policies applied"

# Apply ConfigMaps and Secrets
print_status "Applying ConfigMaps and Secrets..."
kubectl apply -f "$K8S_DIR/configmap.yaml"
kubectl apply -f "$K8S_DIR/secrets.yaml"
kubectl apply -f "$K8S_DIR/postgres-init-configmap.yaml"
print_success "ConfigMaps and Secrets applied"

# Deploy databases and infrastructure
print_status "Deploying databases and infrastructure..."
kubectl apply -f "$K8S_DIR/postgres-deployment.yaml"
kubectl apply -f "$K8S_DIR/mongodb-deployment.yaml"
kubectl apply -f "$K8S_DIR/redis-deployment.yaml"
kubectl apply -f "$K8S_DIR/kafka-deployment.yaml"
kubectl apply -f "$K8S_DIR/elasticsearch-deployment.yaml"
print_success "Databases and infrastructure deployed"

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n microservices-ai-platform --timeout=300s
kubectl wait --for=condition=ready pod -l app=mongodb -n microservices-ai-platform --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n microservices-ai-platform --timeout=300s
kubectl wait --for=condition=ready pod -l app=kafka -n microservices-ai-platform --timeout=300s
kubectl wait --for=condition=ready pod -l app=elasticsearch -n microservices-ai-platform --timeout=300s
print_success "All databases are ready"

# Deploy microservices
print_status "Deploying microservices..."
kubectl apply -f "$K8S_DIR/api-gateway-deployment.yaml"
kubectl apply -f "$K8S_DIR/user-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/data-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/ai-ml-service-deployment.yaml"
kubectl apply -f "$K8S_DIR/notification-service-deployment.yaml"
print_success "Microservices deployed"

# Deploy frontend
print_status "Deploying frontend..."
kubectl apply -f "$K8S_DIR/frontend-deployment.yaml"
print_success "Frontend deployed"

# Deploy monitoring
print_status "Deploying monitoring stack..."
kubectl apply -f "$K8S_DIR/monitoring-deployment.yaml"
print_success "Monitoring stack deployed"

# Apply network policies
print_status "Applying network policies..."
kubectl apply -f "$K8S_DIR/network-policies.yaml"
print_success "Network policies applied"

# Deploy ingress
print_status "Deploying ingress..."
kubectl apply -f "$K8S_DIR/ingress.yaml"
print_success "Ingress deployed"

# Wait for all deployments to be ready
print_status "Waiting for all deployments to be ready..."
kubectl wait --for=condition=available deployment --all -n microservices-ai-platform --timeout=600s
print_success "All deployments are ready"

# Display deployment status
print_status "Deployment Status:"
kubectl get pods -n microservices-ai-platform
echo ""
kubectl get services -n microservices-ai-platform
echo ""
kubectl get ingress -n microservices-ai-platform

print_success "🎉 Microservices AI Platform deployed successfully!"
print_status "Access the application at: https://microservices-ai-platform.com"
print_status "API Gateway: https://api.microservices-ai-platform.com"
print_status "Grafana Dashboard: http://grafana-service:3000 (admin/admin123)"
print_status "Prometheus: http://prometheus-service:9090"

echo ""
print_warning "Next steps:"
echo "1. Configure DNS to point to your ingress controller"
echo "2. Set up SSL certificates with cert-manager"
echo "3. Configure monitoring alerts"
echo "4. Set up backup strategies for databases"
echo "5. Configure log aggregation"

print_success "Deployment completed successfully! 🚀"