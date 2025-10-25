"""
Prediction API endpoints for AI/ML service

Demonstrates advanced AI/ML capabilities:
- Real-time predictions with TensorFlow
- Recommendation engine with collaborative filtering
- Sentiment analysis and NLP processing
- Performance optimization with caching
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
import asyncio
from datetime import datetime

from app.services.ml_service import MLService
from app.services.redis_service import RedisService

router = APIRouter()
logger = logging.getLogger(__name__)

# Request/Response models
class PredictionRequest(BaseModel):
    model_name: str = Field(..., description="Name of the ML model to use")
    features: List[float] = Field(..., description="Input features for prediction")
    user_id: Optional[str] = Field(None, description="User ID for personalization")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class PredictionResponse(BaseModel):
    prediction: Any = Field(..., description="Model prediction result")
    confidence: float = Field(..., description="Prediction confidence score")
    model_version: str = Field(..., description="Version of the model used")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.now)

class RecommendationRequest(BaseModel):
    user_id: str = Field(..., description="User ID for recommendations")
    item_type: str = Field(..., description="Type of items to recommend")
    num_recommendations: int = Field(default=10, ge=1, le=100)
    filters: Optional[Dict[str, Any]] = Field(None, description="Recommendation filters")

class SentimentRequest(BaseModel):
    text: str = Field(..., description="Text to analyze for sentiment")
    language: str = Field(default="en", description="Language of the text")

@router.post("/predict", response_model=PredictionResponse)
async def predict(
    request: PredictionRequest,
    ml_service: MLService = Depends(),
    redis_service: RedisService = Depends()
):
    """
    Make predictions using trained ML models
    
    Supports various model types:
    - Classification models
    - Regression models
    - Deep learning models
    - Custom ensemble models
    """
    try:
        start_time = asyncio.get_event_loop().time()
        
        # Check cache first
        cache_key = f"prediction:{request.model_name}:{hash(str(request.features))}"
        cached_result = await redis_service.get(cache_key)
        
        if cached_result:
            logger.info(f"Returning cached prediction for model: {request.model_name}")
            return cached_result
        
        # Make prediction
        result = await ml_service.predict(
            model_name=request.model_name,
            features=request.features,
            context=request.context
        )
        
        processing_time = (asyncio.get_event_loop().time() - start_time) * 1000
        
        response = PredictionResponse(
            prediction=result["prediction"],
            confidence=result["confidence"],
            model_version=result["model_version"],
            processing_time_ms=processing_time
        )
        
        # Cache result for 5 minutes
        await redis_service.set(cache_key, response.dict(), expire=300)
        
        logger.info(f"Prediction completed for model: {request.model_name}, time: {processing_time:.2f}ms")
        return response
        
    except Exception as e:
        logger.error(f"Prediction failed for model {request.model_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/recommend")
async def get_recommendations(
    request: RecommendationRequest,
    background_tasks: BackgroundTasks,
    ml_service: MLService = Depends(),
    redis_service: RedisService = Depends()
):
    """
    Generate personalized recommendations using collaborative filtering
    """
    try:
        # Check cache
        cache_key = f"recommendations:{request.user_id}:{request.item_type}:{request.num_recommendations}"
        cached_recommendations = await redis_service.get(cache_key)
        
        if cached_recommendations:
            logger.info(f"Returning cached recommendations for user: {request.user_id}")
            return cached_recommendations
        
        # Generate recommendations
        recommendations = await ml_service.generate_recommendations(
            user_id=request.user_id,
            item_type=request.item_type,
            num_recommendations=request.num_recommendations,
            filters=request.filters
        )
        
        result = {
            "user_id": request.user_id,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat(),
            "algorithm": "collaborative_filtering_v2"
        }
        
        # Cache recommendations for 1 hour
        await redis_service.set(cache_key, result, expire=3600)
        
        # Log recommendation event in background
        background_tasks.add_task(
            ml_service.log_recommendation_event,
            request.user_id,
            recommendations
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Recommendation generation failed for user {request.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")

@router.post("/sentiment")
async def analyze_sentiment(
    request: SentimentRequest,
    ml_service: MLService = Depends()
):
    """
    Analyze sentiment of text using NLP models
    """
    try:
        result = await ml_service.analyze_sentiment(
            text=request.text,
            language=request.language
        )
        
        return {
            "text": request.text,
            "sentiment": result["sentiment"],
            "confidence": result["confidence"],
            "emotions": result.get("emotions", {}),
            "language": request.language,
            "processed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

@router.get("/models")
async def list_available_models(ml_service: MLService = Depends()):
    """
    List all available ML models and their metadata
    """
    try:
        models = await ml_service.get_available_models()
        return {
            "models": models,
            "total_count": len(models),
            "retrieved_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to retrieve models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve models: {str(e)}")

@router.get("/models/{model_name}/info")
async def get_model_info(model_name: str, ml_service: MLService = Depends()):
    """
    Get detailed information about a specific model
    """
    try:
        model_info = await ml_service.get_model_info(model_name)
        if not model_info:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_name}")
        
        return model_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model info for {model_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")