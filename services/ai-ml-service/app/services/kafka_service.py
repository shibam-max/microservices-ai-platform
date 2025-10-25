"""
Kafka Service for event streaming and messaging

Demonstrates event-driven architecture for XYZ Dev Foundation:
- Kafka producer and consumer
- Real-time event processing
- Message serialization and deserialization
"""

from kafka import KafkaProducer, KafkaConsumer
import json
import logging
from typing import Dict, Any, Optional, Callable
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class KafkaService:
    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None
        self.consumers = {}
        self.executor = ThreadPoolExecutor(max_workers=4)
        
    def _get_producer(self) -> KafkaProducer:
        """Get or create Kafka producer"""
        if not self.producer:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',
                retries=3,
                retry_backoff_ms=1000
            )
        return self.producer
    
    async def send_message(self, topic: str, message: Dict[str, Any], key: Optional[str] = None):
        """Send message to Kafka topic"""
        try:
            producer = self._get_producer()
            
            # Send message asynchronously
            future = producer.send(topic, value=message, key=key)
            
            # Wait for the message to be sent
            record_metadata = future.get(timeout=10)
            
            logger.info(f"Message sent to topic {topic}, partition {record_metadata.partition}, offset {record_metadata.offset}")
            
        except Exception as e:
            logger.error(f"Failed to send message to topic {topic}: {str(e)}")
            raise
    
    def create_consumer(self, topics: list, group_id: str, message_handler: Callable) -> KafkaConsumer:
        """Create Kafka consumer"""
        try:
            consumer = KafkaConsumer(
                *topics,
                bootstrap_servers=self.bootstrap_servers,
                group_id=group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                key_deserializer=lambda k: k.decode('utf-8') if k else None,
                auto_offset_reset='earliest',
                enable_auto_commit=True
            )
            
            self.consumers[group_id] = consumer
            
            # Start consuming messages in background
            self.executor.submit(self._consume_messages, consumer, message_handler)
            
            logger.info(f"Created consumer for topics {topics} with group_id {group_id}")
            return consumer
            
        except Exception as e:
            logger.error(f"Failed to create consumer: {str(e)}")
            raise
    
    def _consume_messages(self, consumer: KafkaConsumer, message_handler: Callable):
        """Consume messages from Kafka"""
        try:
            for message in consumer:
                try:
                    # Process message
                    message_handler(message)
                    
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Consumer error: {str(e)}")
    
    async def send_ml_event(self, event_type: str, data: Dict[str, Any]):
        """Send ML-related event"""
        event = {
            "event_type": event_type,
            "timestamp": asyncio.get_event_loop().time(),
            "data": data,
            "service": "ai-ml-service"
        }
        
        await self.send_message("ml-events", event, key=event_type)
    
    async def send_prediction_event(self, model_name: str, prediction_data: Dict[str, Any]):
        """Send prediction event"""
        await self.send_ml_event("prediction_made", {
            "model_name": model_name,
            "prediction": prediction_data
        })
    
    async def send_recommendation_event(self, user_id: str, recommendations: list):
        """Send recommendation event"""
        await self.send_ml_event("recommendations_generated", {
            "user_id": user_id,
            "recommendations_count": len(recommendations),
            "recommendations": recommendations[:5]  # Send only first 5 for logging
        })
    
    def close(self):
        """Close Kafka connections"""
        try:
            if self.producer:
                self.producer.close()
                
            for consumer in self.consumers.values():
                consumer.close()
                
            self.executor.shutdown(wait=True)
            
            logger.info("Kafka service closed successfully")
            
        except Exception as e:
            logger.error(f"Error closing Kafka service: {str(e)}")

# Message handlers
def handle_user_events(message):
    """Handle user-related events"""
    try:
        logger.info(f"Received user event: {message.value}")
        # Process user event for ML personalization
        
    except Exception as e:
        logger.error(f"Error handling user event: {str(e)}")

def handle_data_events(message):
    """Handle data processing events"""
    try:
        logger.info(f"Received data event: {message.value}")
        # Process data event for ML training
        
    except Exception as e:
        logger.error(f"Error handling data event: {str(e)}")