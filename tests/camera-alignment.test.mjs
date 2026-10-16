import assert from "node:assert/strict";
import test from "node:test";
import { Euler, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { CAMERA_MOUNTS, centerChaseCamera, getInteriorFov } from "../lib/camera-alignment.ts";

test("driver camera looks exactly along vehicle forward on flat ground and ramps", () => {
  for (const heading of [-Math.PI, -0.7, 0, 0.8, Math.PI]) {
    for (const pitch of [0, 0.23, -0.15]) {
      const rotation = new Quaternion().setFromEuler(new Euler(0, heading, pitch, "YXZ"));
      const origin = new Vector3(-42, -1, 2);
      const eye = new Vector3(...CAMERA_MOUNTS.interiorEye).applyQuaternion(rotation).add(origin);
      const target = new Vector3(...CAMERA_MOUNTS.interiorTarget).applyQuaternion(rotation).add(origin);
      const expectedForward = new Vector3(-1, 0, 0).applyQuaternion(rotation);
      const camera = new PerspectiveCamera();
      camera.position.copy(eye);
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      assert.ok(camera.getWorldDirection(new Vector3()).distanceTo(expectedForward) < 1e-10);
      const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      assert.ok(Math.abs(right.y) < 1e-10, "Camera has roll");
    }
  }
});

test("chase interpolation stays on the car centerline throughout a turn", () => {
  const origin = new Vector3();
  const position = new Vector3(...CAMERA_MOUNTS.chaseEye);
  for (let index = 1; index <= 120; index++) {
    const rotation = new Quaternion().setFromEuler(new Euler(0, index / 60, 0.15, "YXZ"));
    origin.set(-index * 0.08, -index * 0.01, index * 0.03);
    const desired = new Vector3(...CAMERA_MOUNTS.chaseEye).applyQuaternion(rotation).add(origin);
    const side = new Vector3(0, 0, 1).applyQuaternion(rotation);
    const target = new Vector3(...CAMERA_MOUNTS.chaseTarget).applyQuaternion(rotation).add(origin);
    const heightBefore = position.lerp(desired, 1 - Math.exp(-4 / 60)).y;
    centerChaseCamera(position, origin, side);
    assert.ok(Math.abs(position.clone().sub(origin).dot(side)) < 1e-10, "Chase camera slipped sideways");
    assert.ok(Math.abs(target.clone().sub(origin).dot(side)) < 1e-10, "Chase target slipped sideways");
    assert.equal(position.y, heightBefore);
    assert.ok(position.clone().sub(origin).dot(new Vector3(1, 0, 0).applyQuaternion(rotation)) > 0);
  }
});

test("portrait interior framing retains a mirror-sized margin without changing yaw", () => {
  for (const aspect of [0.3, 0.6, 0.85, 1, 2.25]) {
    const vertical = getInteriorFov(aspect) * Math.PI / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect) * 180 / Math.PI;
    assert.ok(horizontal >= 76 - 1e-10);
    assert.ok(getInteriorFov(aspect) >= 70 && getInteriorFov(aspect) < 170);
  }
});
