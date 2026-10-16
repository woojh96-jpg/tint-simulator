import type { Vector3 } from "three";

// Vehicle forward is local -X. A driver's lateral seat offset does not change
// the viewing direction: the eye and look target have identical Y/Z values.
export const CAMERA_MOUNTS = {
  interiorEye: [-0.18, 1.66, 0.39],
  interiorTarget: [-3.8, 1.66, 0.39],
  chaseEye: [8.5, 4.1, 0],
  chaseTarget: [-3.5, 0.8, 0],
} as const;

/** Retain fore/aft and height smoothing without letting world-space lerp
 * leave the camera beside the car during a turn. No per-frame allocations. */
export function centerChaseCamera(position: Vector3, origin: Vector3, lateralAxis: Vector3): void {
  const lateralOffset = (position.x - origin.x) * lateralAxis.x
    + (position.y - origin.y) * lateralAxis.y
    + (position.z - origin.z) * lateralAxis.z;
  position.addScaledVector(lateralAxis, -lateralOffset);
}

export function getInteriorFov(aspect: number): number {
  // Keep a sliver of the driver's mirror visible on narrow screens, without
  // rotating the camera away from the vehicle's forward axis.
  const minimumHorizontalFov = 76 * Math.PI / 180;
  const verticalFov = 2 * Math.atan(Math.tan(minimumHorizontalFov / 2) / Math.max(0.1, aspect));
  return Math.max(70, verticalFov * 180 / Math.PI);
}
