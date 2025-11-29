"""
Advanced Surgical Analysis Tools for AI Agent

These tools enable sophisticated geometric and safety analysis
for surgical guidance using 3D mesh data and annotations.
"""

import numpy as np
from typing import List, Dict, Tuple
import math


def analyze_mesh_geometry(vertices: List[List[float]], max_samples: int = 100) -> Dict:
    """Analyze 3D mesh geometry to identify key features and zones.
    
    Args:
        vertices: List of [x, y, z] vertex coordinates from 3D model
        max_samples: Maximum vertices to analyze (for performance)
        
    Returns:
        Dictionary with geometric analysis:
        - bounds: min/max coordinates
        - high_risk_zones: Top 20% (vessel-dense areas)
        - safe_zones: Middle 60% 
        - dimensions: Object dimensions
    """
    if not vertices or len(vertices) == 0:
        return {
            "bounds": {"min": [0, 0, 0], "max": [0, 0, 0]},
            "high_risk_zones": [],
            "safe_zones": [],
            "dimensions": [0, 0, 0],
            "analyzed_vertices": 0
        }
    
    # Sample vertices if too many
    if len(vertices) > max_samples:
        step = len(vertices) // max_samples
        vertices = vertices[::step]
    
    vertices_array = np.array(vertices)
    
    # Calculate bounds
    min_coords = vertices_array.min(axis=0)
    max_coords = vertices_array.max(axis=0)
    dimensions = max_coords - min_coords
    
    # Identify zones based on Y-axis (height)
    y_coords = vertices_array[:, 1]
    y_min, y_max = y_coords.min(), y_coords.max()
    y_range = y_max - y_min
    
    # High risk: top 20% (like vessel-dense cap area)
    high_risk_threshold = y_max - (y_range * 0.2)
    high_risk_vertices = vertices_array[y_coords > high_risk_threshold]
    
    # Safe zone: middle 60%
    safe_top_threshold = y_max - (y_range * 0.3)
    safe_bottom_threshold = y_min + (y_range * 0.1)
    safe_mask = (y_coords < safe_top_threshold) & (y_coords > safe_bottom_threshold)
    safe_vertices = vertices_array[safe_mask]
    
    return {
        "bounds": {
            "min": min_coords.tolist(),
            "max": max_coords.tolist()
        },
        "high_risk_zones": [
            {
                "region": "top_20_percent",
                "center": high_risk_vertices.mean(axis=0).tolist() if len(high_risk_vertices) > 0 else max_coords.tolist(),
                "count": len(high_risk_vertices),
                "description": "Vessel-dense area (simulated)"
            }
        ],
        "safe_zones": [
            {
                "region": "middle_60_percent", 
                "center": safe_vertices.mean(axis=0).tolist() if len(safe_vertices) > 0 else [(min_coords[0] + max_coords[0])/2, (min_coords[1] + max_coords[1])/2, (min_coords[2] + max_coords[2])/2],
                "count": len(safe_vertices),
                "description": "Lower risk tissue area"
            }
        ],
        "dimensions": dimensions.tolist(),
        "analyzed_vertices": len(vertices)
    }


def score_entry_point_safety(
    entry_point: List[float],
    mesh_analysis: Dict,
    annotations: List[Dict]
) -> Dict:
    """Score safety of a potential surgical entry point.
    
    Args:
        entry_point: [x, y, z] coordinates of candidate entry point
        mesh_analysis: Output from analyze_mesh_geometry()
        annotations: List of existing annotations
        
    Returns:
        Safety score (0-100) with breakdown
    """
    from backend.tools.measurement_tools import calculate_distance_3d
    
    scores = {
        "overall": 0,
        "breakdown": {}
    }
    
    # Score 1: Distance from high-risk zones (40% weight)
    if mesh_analysis.get("high_risk_zones"):
        min_risk_distance = float('inf')
        for risk_zone in mesh_analysis["high_risk_zones"]:
            dist = calculate_distance_3d(entry_point, risk_zone["center"])["distance_mm"]
            min_risk_distance = min(min_risk_distance, dist)
        
        # Normalize: >50mm = 100 points, <10mm = 0 points
        risk_score = min(100, max(0, (min_risk_distance - 10) / 40 * 100))
        scores["breakdown"]["risk_distance"] = {
            "score": round(risk_score, 1),
            "distance_mm": round(min_risk_distance, 1),
            "weight": 0.4
        }
    else:
        scores["breakdown"]["risk_distance"] = {"score": 50, "distance_mm": 0, "weight": 0.4}
    
    # Score 2: Proximity to safe zone (30% weight)
    if mesh_analysis.get("safe_zones"):
        safe_zone = mesh_analysis["safe_zones"][0]
        safe_dist = calculate_distance_3d(entry_point, safe_zone["center"])["distance_mm"]
        
        # Closer to safe zone = better (inverse scoring)
        safe_score = min(100, max(0, 100 - (safe_dist / 50 * 100)))
        scores["breakdown"]["safe_zone_proximity"] = {
            "score": round(safe_score, 1),
            "distance_mm": round(safe_dist, 1),
            "weight": 0.3
        }
    else:
        scores["breakdown"]["safe_zone_proximity"] = {"score": 50, "distance_mm": 0, "weight": 0.3}
    
    # Score 3: Structural considerations (20% weight)
    # Check if point is within reasonable bounds
    bounds = mesh_analysis.get("bounds", {"min": [-1, -1, -1], "max": [1, 1, 1]})
    in_bounds = all(
        bounds["min"][i] <= entry_point[i] <= bounds["max"][i]
        for i in range(3)
    )
    structural_score = 100 if in_bounds else 0
    scores["breakdown"]["structural_integrity"] = {
        "score": structural_score,
        "in_bounds": in_bounds,
        "weight": 0.2
    }
    
    # Score 4: Avoid collision with annotations (10% weight)
    annotation_score = 100
    if annotations:
        min_annotation_dist = float('inf')
        for ann in annotations:
            if "position" in ann:
                dist = calculate_distance_3d(entry_point, ann["position"])["distance_mm"]
                min_annotation_dist = min(min_annotation_dist, dist)
        
        # Penalize if too close to existing annotations
        if min_annotation_dist < 15:  # Too close
            annotation_score = (min_annotation_dist / 15) * 100
        
        scores["breakdown"]["annotation_clearance"] = {
            "score": round(annotation_score, 1),
            "min_distance_mm": round(min_annotation_dist, 1),
            "weight": 0.1
        }
    else:
        scores["breakdown"]["annotation_clearance"] = {"score": 100, "distance_mm": 0, "weight": 0.1}
    
    # Calculate weighted overall score
    overall = sum(
        detail["score"] * detail["weight"]
        for detail in scores["breakdown"].values()
    )
    scores["overall"] = round(overall, 1)
    
    # Add risk level classification
    if overall >= 85:
        scores["risk_level"] = "low"
        scores["recommendation"] = "SAFE - Proceed with standard precautions"
    elif overall >= 70:
        scores["risk_level"] = "medium"
        scores["recommendation"] = "CAUTION - Monitor closely during approach"
    else:
        scores["risk_level"] = "high"
        scores["recommendation"] = "HIGH RISK - Consider alternative entry point"
    
    return scores


def find_candidate_entry_points(
    mesh_analysis: Dict,
    num_candidates: int = 5
) -> List[Dict]:
    """Generate candidate entry points for surgical access.
    
    Args:
        mesh_analysis: Output from analyze_mesh_geometry()
        num_candidates: Number of candidate points to generate
        
    Returns:
        List of candidate entry points with positions and metadata
    """
    candidates = []
    bounds = mesh_analysis.get("bounds", {"min": [-1, -1, -1], "max": [1, 1, 1]})
    
    # Get safe zone center as primary candidate
    if mesh_analysis.get("safe_zones"):
        safe_center = mesh_analysis["safe_zones"][0]["center"]
        candidates.append({
            "position": safe_center,
            "approach": "central_safe_zone",
            "description": "Center of identified safe zone"
        })
    
    # Generate additional candidates in safe zone
    min_coords = np.array(bounds["min"])
    max_coords = np.array(bounds["max"])
    center = (min_coords + max_coords) / 2
    
    # Vary positions in middle region
    y_middle = center[1]
    radius = (max_coords[0] - min_coords[0]) * 0.3  # 30% of width
    
    angles = np.linspace(0, 2 * np.pi, num_candidates - 1, endpoint=False)
    
    for angle in angles:
        x = center[0] + radius * np.cos(angle)
        z = center[2] + radius * np.sin(angle)
        
        candidates.append({
            "position": [float(x), float(y_middle), float(z)],
            "approach": f"lateral_{int(np.degrees(angle))}deg",
            "description": f"Lateral approach at {int(np.degrees(angle))}°"
        })
    
    return candidates[:num_candidates]


def calculate_approach_vector(
    entry_point: List[float],
    target_point: List[float]
) -> Dict:
    """Calculate optimal approach vector and angle.
    
    Args:
        entry_point: Starting point [x, y, z]
        target_point: Target point [x, y, z]
        
    Returns:
        Approach vector information with angles and direction
    """
    entry = np.array(entry_point)
    target = np.array(target_point)
    
    # Direction vector
    direction = target - entry
    distance = np.linalg.norm(direction)
    
    if distance < 0.001:  # Too close
        return {
            "vector": [0, -1, 0],  # Default downward
            "distance_mm": 0,
            "angle_from_vertical": 0,
            "azimuth_angle": 0
        }
    
    direction_normalized = direction / distance
    
    # Angle from vertical (y-axis)
    vertical = np.array([0, -1, 0])  # Downward
    angle_from_vertical = np.arccos(np.clip(np.dot(direction_normalized, vertical), -1.0, 1.0))
    angle_from_vertical_deg = np.degrees(angle_from_vertical)
    
    # Azimuth angle (rotation around y-axis)
    azimuth = np.arctan2(direction[0], direction[2])
    azimuth_deg = np.degrees(azimuth)
    
    return {
        "vector": direction_normalized.tolist(),
        "distance_mm": round(distance * 10, 1),  # Convert to mm
        "angle_from_vertical": round(angle_from_vertical_deg, 1),
        "azimuth_angle": round(azimuth_deg, 1),
        "description": f"Approach: {angle_from_vertical_deg:.0f}° from vertical, {azimuth_deg:.0f}° azimuth"
    }


def assess_tissue_depth(entry_point: List[float], mesh_analysis: Dict) -> Dict:
    """Estimate tissue depth at entry point.
    
    Args:
        entry_point: [x, y, z] coordinates
        mesh_analysis: Mesh geometry analysis
        
    Returns:
        Estimated tissue depth and access difficulty
    """
    bounds = mesh_analysis.get("bounds", {"min": [0, 0, 0], "max": [1, 1, 1]})
    
    # Estimate depth based on Y-coordinate
    y_min = bounds["min"][1]
    y_max = bounds["max"][1]
    y_range = y_max - y_min
    
    # Depth from surface (assuming top is surface)
    depth_from_top = (y_max - entry_point[1]) / y_range
    estimated_depth_mm = depth_from_top * 100  # Assume max 100mm object
    
    # Access difficulty based on depth
    if estimated_depth_mm < 20:
        difficulty = "easy"
        description = "Superficial access, good visibility"
    elif estimated_depth_mm < 50:
        difficulty = "moderate"
        description = "Moderate depth, standard approach"
    else:
        difficulty = "challenging"
        description = "Deep access, requires careful navigation"
    
    return {
        "depth_mm": round(estimated_depth_mm, 1),
        "depth_percentage": round(depth_from_top * 100, 1),
        "difficulty": difficulty,
        "description": description,
        "visibility": "good" if estimated_depth_mm < 30 else "moderate" if estimated_depth_mm < 60 else "limited"
    }
