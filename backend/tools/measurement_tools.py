import math
import numpy as np

def calculate_distance_3d(point1: list[float], point2: list[float]) -> dict:
    """Calculate 3D Euclidean distance between two points.
    
    Args:
        point1: [x, y, z] coordinates of first point
        point2: [x, y, z] coordinates of second point
        
    Returns:
        Dictionary with distance in mm and formatted string
    """
    dx = point2[0] - point1[0]
    dy = point2[1] - point1[1]
    dz = point2[2] - point1[2]
    
    distance = math.sqrt(dx**2 + dy**2 + dz**2)
    distance_mm = distance * 10  # Convert to millimeters (assuming units)
    
    return {
        "distance_mm": round(distance_mm, 1),
        "distance_cm": round(distance_mm / 10, 2),
        "formatted": f"{distance_mm:.1f}mm"
    }

def calculate_angle(point1: list[float], vertex: list[float], point2: list[float]) -> dict:
    """Calculate angle between three points.
    
    Args:
        point1: First point
        vertex: Vertex point (angle measured here)
        point2: Second point
        
    Returns:
        Dictionary with angle in degrees
    """
    # Create vectors
    v1 = np.array(point1) - np.array(vertex)
    v2 = np.array(point2) - np.array(vertex)
    
    # Calculate angle
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    angle_rad = np.arccos(np.clip(cos_angle, -1.0, 1.0))
    angle_deg = np.degrees(angle_rad)
    
    return {
        "angle_degrees": round(angle_deg, 1),
        "angle_radians": round(angle_rad, 3),
        "formatted": f"{angle_deg:.1f}°"
    }

def assess_risk_zone(annotation_position: list[float], critical_zones: list[dict]) -> dict:
    """Assess if annotation is near critical anatomical structures.
    
    Args:
        annotation_position: [x, y, z] position to check
        critical_zones: List of {position, radius, name} dicts
        
    Returns:
        Risk assessment with warnings
    """
    warnings = []
    min_distance = float('inf')
    nearest_structure = None
    
    for zone in critical_zones:
        distance = calculate_distance_3d(annotation_position, zone['position'])['distance_mm']
        if distance < zone['radius']:
            warnings.append(f"⚠️ Within {distance:.1f}mm of {zone['name']}")
        if distance < min_distance:
            min_distance = distance
            nearest_structure = zone['name']
    
    risk_level = "high" if warnings else ("medium" if min_distance < 20 else "low")
    
    return {
        "risk_level": risk_level,
        "warnings": warnings,
        "nearest_structure": nearest_structure,
        "distance_to_nearest": round(min_distance, 1)
    }
