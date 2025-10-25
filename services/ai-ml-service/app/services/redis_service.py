"""
Redis Service for caching and session management

Demonstrates performance optimization for XYZ Dev Foundation:
- Redis caching for ML predictions
- Session management
- Real-time data storage
"""

import redis.asyncio as redis
import json
import logging
from typing import Any, Optional, Dict
import pickle

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0):
        self.host = host
        self.port = port
        self.db = db
        self.redis_client = None
        
    async def _get_client(self):
        """Get or create Redis client"""
        if not self.redis_client:
            self.redis_client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=True
            )
        return self.redis_client
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None):
        """Set value in Redis with optional expiration"""
        try:
            client = await self._get_client()
            
            # Serialize value
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value)
            else:
                serialized_value = str(value)
            
            await client.set(key, serialized_value, ex=expire)
            logger.debug(f"Set key {key} in Redis with expiration {expire}")
            
        except Exception as e:
            logger.error(f"Failed to set key {key} in Redis: {str(e)}")
            raise
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        try:
            client = await self._get_client()
            value = await client.get(key)
            
            if value is None:
                return None
            
            # Try to deserialize as JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
                
        except Exception as e:
            logger.error(f"Failed to get key {key} from Redis: {str(e)}")
            return None
    
    async def delete(self, key: str):
        """Delete key from Redis"""
        try:
            client = await self._get_client()
            await client.delete(key)
            logger.debug(f"Deleted key {key} from Redis")
            
        except Exception as e:
            logger.error(f"Failed to delete key {key} from Redis: {str(e)}")
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis"""
        try:
            client = await self._get_client()
            return await client.exists(key) > 0
            
        except Exception as e:
            logger.error(f"Failed to check existence of key {key}: {str(e)}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter in Redis"""
        try:
            client = await self._get_client()
            return await client.incrby(key, amount)
            
        except Exception as e:
            logger.error(f"Failed to increment key {key}: {str(e)}")
            raise
    
    async def set_hash(self, key: str, mapping: Dict[str, Any]):
        """Set hash in Redis"""
        try:
            client = await self._get_client()
            
            # Serialize values in mapping
            serialized_mapping = {}
            for k, v in mapping.items():
                if isinstance(v, (dict, list)):
                    serialized_mapping[k] = json.dumps(v)
                else:
                    serialized_mapping[k] = str(v)
            
            await client.hset(key, mapping=serialized_mapping)
            logger.debug(f"Set hash {key} in Redis")
            
        except Exception as e:
            logger.error(f"Failed to set hash {key}: {str(e)}")
            raise
    
    async def get_hash(self, key: str) -> Optional[Dict[str, Any]]:
        """Get hash from Redis"""
        try:
            client = await self._get_client()
            hash_data = await client.hgetall(key)
            
            if not hash_data:
                return None
            
            # Deserialize values
            result = {}
            for k, v in hash_data.items():
                try:
                    result[k] = json.loads(v)
                except json.JSONDecodeError:
                    result[k] = v
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get hash {key}: {str(e)}")
            return None
    
    async def cache_prediction(self, model_name: str, features_hash: str, prediction: Dict[str, Any], ttl: int = 300):
        """Cache ML prediction result"""
        cache_key = f"prediction:{model_name}:{features_hash}"
        await self.set(cache_key, prediction, expire=ttl)
    
    async def get_cached_prediction(self, model_name: str, features_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached ML prediction"""
        cache_key = f"prediction:{model_name}:{features_hash}"
        return await self.get(cache_key)
    
    async def cache_recommendations(self, user_id: str, item_type: str, recommendations: list, ttl: int = 3600):
        """Cache user recommendations"""
        cache_key = f"recommendations:{user_id}:{item_type}"
        await self.set(cache_key, recommendations, expire=ttl)
    
    async def get_cached_recommendations(self, user_id: str, item_type: str) -> Optional[list]:
        """Get cached recommendations"""
        cache_key = f"recommendations:{user_id}:{item_type}"
        return await self.get(cache_key)
    
    async def track_api_usage(self, endpoint: str, user_id: Optional[str] = None):
        """Track API usage statistics"""
        try:
            # Track global endpoint usage
            await self.increment(f"api_usage:{endpoint}")
            
            # Track user-specific usage if user_id provided
            if user_id:
                await self.increment(f"user_usage:{user_id}:{endpoint}")
            
            # Track daily usage
            from datetime import datetime
            today = datetime.now().strftime("%Y-%m-%d")
            await self.increment(f"daily_usage:{today}:{endpoint}")
            
        except Exception as e:
            logger.error(f"Failed to track API usage: {str(e)}")
    
    async def get_api_stats(self) -> Dict[str, Any]:
        """Get API usage statistics"""
        try:
            client = await self._get_client()
            
            # Get all API usage keys
            usage_keys = await client.keys("api_usage:*")
            stats = {}
            
            for key in usage_keys:
                endpoint = key.replace("api_usage:", "")
                count = await client.get(key)
                stats[endpoint] = int(count) if count else 0
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get API stats: {str(e)}")
            return {}
    
    def close(self):
        """Close Redis connection"""
        try:
            if self.redis_client:
                # Note: redis.asyncio doesn't have a synchronous close method
                # The connection will be closed when the client is garbage collected
                self.redis_client = None
            logger.info("Redis service closed")
            
        except Exception as e:
            logger.error(f"Error closing Redis service: {str(e)}")