"""
Input validation and sanitization for AI/ML service
"""

import re
import html
from typing import Any, Dict, List
import logging

logger = logging.getLogger(__name__)

class InputValidator:
    
    @staticmethod
    def sanitize_string(value: str) -> str:
        """Sanitize string input to prevent injection attacks"""
        if not isinstance(value, str):
            return str(value)
        
        # HTML escape
        sanitized = html.escape(value)
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\';\\]', '', sanitized)
        
        # Limit length
        if len(sanitized) > 1000:
            sanitized = sanitized[:1000]
            
        return sanitized.strip()
    
    @staticmethod
    def validate_model_name(model_name: str) -> str:
        """Validate model name to prevent path traversal"""
        if not model_name:
            raise ValueError("Model name cannot be empty")
            
        # Only allow alphanumeric, underscore, hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', model_name):
            raise ValueError("Invalid model name format")
            
        # Prevent path traversal
        if '..' in model_name or '/' in model_name or '\\' in model_name:
            raise ValueError("Model name contains invalid characters")
            
        return model_name
    
    @staticmethod
    def validate_features(features: List[float]) -> List[float]:
        """Validate feature array"""
        if not isinstance(features, list):
            raise ValueError("Features must be a list")
            
        if len(features) == 0:
            raise ValueError("Features cannot be empty")
            
        if len(features) > 1000:
            raise ValueError("Too many features (max 1000)")
            
        validated_features = []
        for feature in features:
            try:
                validated_features.append(float(feature))
            except (ValueError, TypeError):
                raise ValueError("All features must be numeric")
                
        return validated_features
    
    @staticmethod
    def sanitize_log_message(message: str) -> str:
        """Sanitize log messages to prevent log injection"""
        if not isinstance(message, str):
            message = str(message)
            
        # Remove newlines and carriage returns
        sanitized = re.sub(r'[\r\n]', ' ', message)
        
        # Remove control characters
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', sanitized)
        
        # Limit length
        if len(sanitized) > 500:
            sanitized = sanitized[:500] + "..."
            
        return sanitized