"""
AI/ML Service for Microservices Platform

Demonstrates XYZ Dev Foundation requirements:
- Python FastAPI for high-performance APIs
- AI/ML integration with TensorFlow and scikit-learn
- Real-time prediction and analytics
- Integration with Kafka and Redis
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from contextlib import asynccontextmanager

from app.api.prediction import router as prediction_router
from app.api.analytics import router as analytics_router
from app.services.ml_service import MLService
from app.services.kafka_service import KafkaService
from app.services.redis_service import RedisService
from app.security.input_validator import InputValidator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
ml_service = None
kafka_service = None
redis_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global ml_service, kafka_service, redis_service
    
    logger.info("Starting AI/ML Service...")
    
    # Initialize services
    ml_service = MLService()
    kafka_service = KafkaService()
    redis_service = RedisService()
    
    # Load ML models
    await ml_service.load_models()
    
    logger.info("AI/ML Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI/ML Service...")
    if kafka_service:
        kafka_service.close()
    if redis_service:
        redis_service.close()

# Create FastAPI app
app = FastAPI(
    title="AI/ML Service",
    description="Microservices AI/ML Platform - Intelligent Data Processing and Predictions",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(prediction_router, prefix="/api/v1/ml", tags=["predictions"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])

@app.get("/")
async def root():
    return {"message": "AI/ML Service is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "ai-ml-service",
        "models_loaded": ml_service.models_loaded if ml_service else False
    }

# Dependency injection
def get_ml_service() -> MLService:
    return ml_service

def get_kafka_service() -> KafkaService:
    return kafka_service

def get_redis_service() -> RedisService:
    return redis_service

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8083,
        reload=True,
        log_level="info"
    )