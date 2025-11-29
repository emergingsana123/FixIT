import * as THREE from 'three';

export class CoordinateTransformer {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.vector = new THREE.Vector3();
  }

  // Convert 3D world position to 2D screen position
  worldToScreen(position) {
    this.vector.copy(position);
    this.vector.project(this.camera);

    const x = (this.vector.x * 0.5 + 0.5) * this.canvas.width;
    const y = (this.vector.y * -0.5 + 0.5) * this.canvas.height;

    return { x, y, inView: this.vector.z < 1 };
  }

  // Get camera transform for video overlay
  getCameraTransform() {
    return {
      position: this.camera.position.toArray(),
      rotation: this.camera.rotation.toArray(),
      fov: this.camera.fov
    };
  }
}
