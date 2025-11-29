import asyncio
import time
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.agents.medical_agent import MedicalAnalysisAgent

async def benchmark_demo():
    """Measure timing of each demo component."""
    
    print("📊 Performance Benchmark\n")
    
    timings = {}
    
    # Benchmark: AI analysis
    medical = MedicalAnalysisAgent()
    
    annotations = [{"position": [0, 0, 0]}, {"position": [1, 0, 0]}]
    start = time.time()
    result = await medical.analyze_annotations(annotations, "distance?")
    timings['ai_analysis'] = time.time() - start
    
    # Print results
    print("Timing Results:")
    print(f"  AI Analysis:         {timings['ai_analysis']:.2f}s")
    
    # Validate against requirements
    if timings['ai_analysis'] < 5:
        print("\n✅ Performance requirements met!")
    else:
        print("\n⚠️ AI analysis slower than target (5s)")

if __name__ == "__main__":
    asyncio.run(benchmark_demo())
