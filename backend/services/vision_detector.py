"""
OpenAI Vision-based bottle detection
Uses GPT-4 Vision to accurately detect bottle and its parts
"""

import os
import base64
from io import BytesIO
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def detect_bottle_with_vision(image_base64: str):
    """
    Use GPT-4 Vision to detect bottle and return bounding box coordinates
    
    Args:
        image_base64: Base64 encoded image from webcam
        
    Returns:
        dict with bottle detection info: {
            'detected': bool,
            'bbox': {'x': int, 'y': int, 'width': int, 'height': int},
            'parts': {
                'cap': {'x': int, 'y': int},
                'middle': {'x': int, 'y': int},
                'bottom': {'x': int, 'y': int}
            },
            'confidence': float
        }
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # GPT-4 with vision
            messages=[
                {
                    "role": "system",
                    "content": """You are a vision AI that detects bottles in images. 
                    Your job is to find ANY bottle in the frame, even if partially visible or low quality.
                    IGNORE all other objects (people, furniture, etc.) - ONLY detect bottles.
                    
                    Return ONLY a JSON object with this exact structure:
                    {
                        "detected": true/false,
                        "bbox": {"x": <left>, "y": <top>, "width": <width>, "height": <height>},
                        "parts": {
                            "cap": {"x": <center_x>, "y": <center_y>},
                            "middle": {"x": <center_x>, "y": <center_y>},
                            "bottom": {"x": <center_x>, "y": <center_y>}
                        },
                        "confidence": <0.0-1.0>
                    }
                    
                    Rules:
                    - AGGRESSIVELY look for bottles, even partial or blurry ones
                    - Coordinates are in pixels from top-left (0,0)
                    - If no bottle detected, set detected=false and confidence=0
                    - bbox is the full bottle bounding box
                    - parts.cap is the center of the bottle cap/top
                    - parts.middle is the center of the bottle body
                    - parts.bottom is the center of the bottle base
                    - Return ONLY valid JSON, no markdown, no explanation
                    - IGNORE people, hands, faces - ONLY bottles
                    """
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Detect the bottle in this image and return the JSON with coordinates."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "low"  # Faster processing
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.1  # Low temperature for consistent results
        )
        
        # Parse the response
        import json
        result_text = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        
        result = json.loads(result_text)
        return result
        
    except Exception as e:
        print(f"Vision detection error: {e}")
        return {
            "detected": False,
            "bbox": {"x": 0, "y": 0, "width": 0, "height": 0},
            "parts": {
                "cap": {"x": 0, "y": 0},
                "middle": {"x": 0, "y": 0},
                "bottom": {"x": 0, "y": 0}
            },
            "confidence": 0.0
        }


def detect_bottle_fast(image_base64: str):
    """
    Faster version - just detects bottle bounding box, no parts
    Use this for real-time tracking
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """Detect bottle in image. Return ONLY JSON:
                    {"detected": true/false, "bbox": {"x": int, "y": int, "width": int, "height": int}, "confidence": float}
                    No markdown, just JSON."""
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Find the bottle."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "low"
                            }
                        }
                    ]
                }
            ],
            max_tokens=200,
            temperature=0
        )
        
        import json
        result_text = response.choices[0].message.content.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        
        return json.loads(result_text)
        
    except Exception as e:
        print(f"Fast detection error: {e}")
        return {"detected": False, "bbox": {"x": 0, "y": 0, "width": 0, "height": 0}, "confidence": 0.0}
