"""
Script to create simple placeholder GLB models for the demo.
These are basic geometric shapes that can be used for testing.
For a real demo, replace these with actual 3D scans using Polycam or downloaded models.
"""

import struct
import json
import base64
from pathlib import Path

def create_simple_glb(output_path, vertices, indices, name="Model"):
    """
    Create a simple GLB file with given vertices and indices.
    GLB format: Binary glTF 2.0
    """
    
    # Convert vertices to binary
    vertex_data = b''.join(struct.pack('<fff', *v) for v in vertices)
    vertex_buffer_length = len(vertex_data)
    
    # Convert indices to binary
    index_data = b''.join(struct.pack('<H', i) for i in indices)
    index_buffer_length = len(index_data)
    
    # Total buffer data
    buffer_data = vertex_data + index_data
    buffer_length = len(buffer_data)
    
    # Create glTF JSON structure
    gltf = {
        "asset": {"version": "2.0", "generator": "Simple GLB Generator"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{
            "primitives": [{
                "attributes": {"POSITION": 0},
                "indices": 1,
                "mode": 4  # TRIANGLES
            }]
        }],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,  # FLOAT
                "count": len(vertices),
                "type": "VEC3",
                "max": [max(v[i] for v in vertices) for i in range(3)],
                "min": [min(v[i] for v in vertices) for i in range(3)]
            },
            {
                "bufferView": 1,
                "componentType": 5123,  # UNSIGNED_SHORT
                "count": len(indices),
                "type": "SCALAR"
            }
        ],
        "bufferViews": [
            {
                "buffer": 0,
                "byteOffset": 0,
                "byteLength": vertex_buffer_length,
                "target": 34962  # ARRAY_BUFFER
            },
            {
                "buffer": 0,
                "byteOffset": vertex_buffer_length,
                "byteLength": index_buffer_length,
                "target": 34963  # ELEMENT_ARRAY_BUFFER
            }
        ],
        "buffers": [{"byteLength": buffer_length}]
    }
    
    # Convert JSON to bytes
    json_data = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    json_length = len(json_data)
    json_padding = (4 - (json_length % 4)) % 4
    json_data += b' ' * json_padding
    json_chunk_length = len(json_data)
    
    # Pad binary data to 4-byte alignment
    buffer_padding = (4 - (buffer_length % 4)) % 4
    buffer_data += b'\x00' * buffer_padding
    buffer_chunk_length = len(buffer_data)
    
    # Total file length
    total_length = 12 + 8 + json_chunk_length + 8 + buffer_chunk_length
    
    # Write GLB file
    with open(output_path, 'wb') as f:
        # Header
        f.write(b'glTF')  # Magic
        f.write(struct.pack('<I', 2))  # Version
        f.write(struct.pack('<I', total_length))  # Total length
        
        # JSON chunk
        f.write(struct.pack('<I', json_chunk_length))  # Chunk length
        f.write(b'JSON')  # Chunk type
        f.write(json_data)
        
        # Binary chunk
        f.write(struct.pack('<I', buffer_chunk_length))  # Chunk length
        f.write(b'BIN\x00')  # Chunk type
        f.write(buffer_data)
    
    print(f"✓ Created {output_path.name} ({total_length} bytes)")

def create_bottle_small():
    """Create a small cylindrical bottle shape"""
    vertices = [
        # Bottom circle (y=0)
        [0.0, 0.0, 0.0],
        [0.2, 0.0, 0.0], [0.14, 0.0, 0.14], [0.0, 0.0, 0.2],
        [-0.14, 0.0, 0.14], [-0.2, 0.0, 0.0], [-0.14, 0.0, -0.14], [0.0, 0.0, -0.2], [0.14, 0.0, -0.14],
        # Top circle (y=0.5)
        [0.0, 0.5, 0.0],
        [0.2, 0.5, 0.0], [0.14, 0.5, 0.14], [0.0, 0.5, 0.2],
        [-0.14, 0.5, 0.14], [-0.2, 0.5, 0.0], [-0.14, 0.5, -0.14], [0.0, 0.5, -0.2], [0.14, 0.5, -0.14],
    ]
    
    indices = [
        # Bottom face
        0,1,2, 0,2,3, 0,3,4, 0,4,5, 0,5,6, 0,6,7, 0,7,8, 0,8,1,
        # Top face
        9,11,10, 9,12,11, 9,13,12, 9,14,13, 9,15,14, 9,16,15, 9,17,16, 9,10,17,
        # Sides
        1,10,11, 1,11,2, 2,11,12, 2,12,3, 3,12,13, 3,13,4,
        4,13,14, 4,14,5, 5,14,15, 5,15,6, 6,15,16, 6,16,7,
        7,16,17, 7,17,8, 8,17,10, 8,10,1
    ]
    
    return vertices, indices

def create_bottle_medium():
    """Create a medium cylindrical bottle shape"""
    vertices = [
        # Bottom circle
        [0.0, 0.0, 0.0],
        [0.3, 0.0, 0.0], [0.21, 0.0, 0.21], [0.0, 0.0, 0.3],
        [-0.21, 0.0, 0.21], [-0.3, 0.0, 0.0], [-0.21, 0.0, -0.21], [0.0, 0.0, -0.3], [0.21, 0.0, -0.21],
        # Top circle (taller)
        [0.0, 0.8, 0.0],
        [0.3, 0.8, 0.0], [0.21, 0.8, 0.21], [0.0, 0.8, 0.3],
        [-0.21, 0.8, 0.21], [-0.3, 0.8, 0.0], [-0.21, 0.8, -0.21], [0.0, 0.8, -0.3], [0.21, 0.8, -0.21],
    ]
    
    indices = [
        0,1,2, 0,2,3, 0,3,4, 0,4,5, 0,5,6, 0,6,7, 0,7,8, 0,8,1,
        9,11,10, 9,12,11, 9,13,12, 9,14,13, 9,15,14, 9,16,15, 9,17,16, 9,10,17,
        1,10,11, 1,11,2, 2,11,12, 2,12,3, 3,12,13, 3,13,4,
        4,13,14, 4,14,5, 5,14,15, 5,15,6, 6,15,16, 6,16,7,
        7,16,17, 7,17,8, 8,17,10, 8,10,1
    ]
    
    return vertices, indices

def create_bottle_large():
    """Create a large cylindrical bottle shape"""
    vertices = [
        # Bottom circle
        [0.0, 0.0, 0.0],
        [0.4, 0.0, 0.0], [0.28, 0.0, 0.28], [0.0, 0.0, 0.4],
        [-0.28, 0.0, 0.28], [-0.4, 0.0, 0.0], [-0.28, 0.0, -0.28], [0.0, 0.0, -0.4], [0.28, 0.0, -0.28],
        # Top circle (tallest)
        [0.0, 1.0, 0.0],
        [0.4, 1.0, 0.0], [0.28, 1.0, 0.28], [0.0, 1.0, 0.4],
        [-0.28, 1.0, 0.28], [-0.4, 1.0, 0.0], [-0.28, 1.0, -0.28], [0.0, 1.0, -0.4], [0.28, 1.0, -0.28],
    ]
    
    indices = [
        0,1,2, 0,2,3, 0,3,4, 0,4,5, 0,5,6, 0,6,7, 0,7,8, 0,8,1,
        9,11,10, 9,12,11, 9,13,12, 9,14,13, 9,15,14, 9,16,15, 9,17,16, 9,10,17,
        1,10,11, 1,11,2, 2,11,12, 2,12,3, 3,12,13, 3,13,4,
        4,13,14, 4,14,5, 5,14,15, 5,15,6, 6,15,16, 6,16,7,
        7,16,17, 7,17,8, 8,17,10, 8,10,1
    ]
    
    return vertices, indices

if __name__ == "__main__":
    # Create models directory if it doesn't exist
    models_dir = Path("assets/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print("Creating placeholder 3D models for demo...\n")
    
    # Create three bottle models
    vertices, indices = create_bottle_small()
    create_simple_glb(models_dir / "bottle_small.glb", vertices, indices, "Small Bottle")
    
    vertices, indices = create_bottle_medium()
    create_simple_glb(models_dir / "bottle_medium.glb", vertices, indices, "Medium Bottle")
    
    vertices, indices = create_bottle_large()
    create_simple_glb(models_dir / "bottle_large.glb", vertices, indices, "Large Bottle")
    
    print("\n✅ Phase 3 Success Criteria:")
    print("   ✓ Have 3+ different 3D models in assets/models/")
    
    # Check file sizes
    for model_file in models_dir.glob("*.glb"):
        size_mb = model_file.stat().st_size / (1024 * 1024)
        size_kb = model_file.stat().st_size / 1024
        print(f"   ✓ {model_file.name}: {size_kb:.2f}KB (under 10MB)")
    
    print("\n📝 Note: These are simple geometric placeholders.")
    print("   For a real demo, use Polycam app or download from Sketchfab.")
