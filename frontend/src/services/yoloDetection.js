/**
 * Simple YOLO-based object detection for bottle tracking
 * Uses browser-based inference with ultralytics YOLO models
 */

export class YOLODetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
  }

  async loadModel() {
    if (this.isLoading || this.model) return;
    
    this.isLoading = true;
    try {
      // For now, we'll use a lightweight alternative: MediaPipe Object Detection
      // which is already installed and works in the browser
      const { ObjectDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      this.model = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite'
        },
        scoreThreshold: 0.25, // LOWERED for aggressive bottle detection
        maxResults: 10, // Check more objects
        runningMode: 'VIDEO'
      });
      
      console.log('✅ Object detector loaded');
    } catch (error) {
      console.error('Failed to load detector:', error);
      this.model = null;
    } finally {
      this.isLoading = false;
    }
  }

  async detectObjects(videoElement) {
    if (!this.model || !videoElement) {
      return [];
    }

    try {
      const detections = this.model.detectForVideo(videoElement, performance.now());
      
      // AGGRESSIVE BOTTLE-ONLY FILTERING
      // Ignore people, chairs, etc. - ONLY look for bottles
      const bottleObjects = detections.detections
        .filter(det => {
          const category = det.categories[0];
          // Only accept bottle-like objects
          return category.categoryName === 'bottle' || 
                 category.categoryName === 'wine glass' ||
                 category.categoryName === 'cup';
        })
        .map(det => ({
          class: det.categories[0].categoryName,
          score: det.categories[0].score,
          bbox: {
            x: det.boundingBox.originX,
            y: det.boundingBox.originY,
            width: det.boundingBox.width,
            height: det.boundingBox.height
          }
        }));

      // Sort by confidence
      bottleObjects.sort((a, b) => b.score - a.score);

      if (bottleObjects.length > 0) {
        console.log(`🍾 Found ${bottleObjects.length} bottle(s), best: ${bottleObjects[0].class} (${Math.round(bottleObjects[0].score * 100)}%)`);
      }

      return bottleObjects;
    } catch (error) {
      console.error('Detection error:', error);
      return [];
    }
  }

  async detectBottle(videoElement) {
    const objects = await this.detectObjects(videoElement);
    
    // Return ONLY if we found a bottle-like object
    // Do NOT fallback to other objects (no people, chairs, etc.)
    if (objects.length === 0) {
      return null; // No bottle found, trigger GPT-4V fallback
    }
    
    // Return highest confidence bottle
    return objects[0];
  }
}

// Singleton instance
let detectorInstance = null;

export async function getDetector() {
  if (!detectorInstance) {
    detectorInstance = new YOLODetector();
    await detectorInstance.loadModel();
  }
  return detectorInstance;
}
