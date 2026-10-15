"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Euler, PerspectiveCamera, Quaternion, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { DrivingState } from "../../lib/driving-config";

export type CameraView = "perspective" | "front" | "side" | "interior" | "chase";

export default function DrivingCamera({ stateRef, view, viewRevision, resetRevision }: {
  stateRef: RefObject<DrivingState>;
  view: CameraView;
  viewRevision: number;
  resetRevision: number;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { size } = useThree();
  const tracking = view === "interior" || view === "chase";
  const scratch = useRef({
    rotation: new Euler(0, 0, 0, "YXZ"),
    quaternion: new Quaternion(),
    position: new Vector3(),
    target: new Vector3(),
    smoothedTarget: new Vector3(),
    origin: new Vector3(),
    initialized: false,
    configured: false,
  });

  useEffect(() => {
    scratch.current.initialized = false;
    scratch.current.configured = false;
  }, [resetRevision, size.width, size.height, view, viewRevision]);

  useFrame(({ camera }, delta) => {
    const data = scratch.current;
    const state = stateRef.current;
    if (!data.configured) {
      if (camera instanceof PerspectiveCamera) {
        camera.fov = view === "interior" ? 70 : view === "chase" ? 50 : 38;
        camera.near = view === "interior" ? 0.025 : 0.1;
        camera.far = 230;
        camera.updateProjectionMatrix();
      }
      if (!tracking) {
        const fit = Math.max(1, 1.12 / (size.width / size.height));
        const positions = { perspective: [-7, 4, 7], front: [-10, 3, 0], side: [0, 3.5, 11] } as const;
        const [x, y, z] = positions[view as keyof typeof positions];
        camera.position.set(state.x + x * fit, state.y + y * fit, state.z + z * fit);
        camera.lookAt(state.x, state.y + 0.9, state.z);
        controls.current?.target.set(state.x, state.y + 0.9, state.z);
        controls.current?.update();
      }
      data.configured = true;
    }
    if (!tracking) return;
    data.rotation.set(0, state.heading, state.pitch, "YXZ");
    data.quaternion.setFromEuler(data.rotation);
    if (view === "interior") {
      data.position.set(-0.18, 1.66, 0.39);
      data.target.set(-3.8, 1.5, 1);
    } else {
      data.position.set(8.5, 4.1, 3.1);
      data.target.set(-3.5, 0.8, 0);
    }
    data.origin.set(state.x, state.y, state.z);
    data.position.applyQuaternion(data.quaternion).add(data.origin);
    data.target.applyQuaternion(data.quaternion).add(data.origin);
    if (view === "interior" || !data.initialized) {
      camera.position.copy(data.position);
      data.smoothedTarget.copy(data.target);
    } else {
      const blend = 1 - Math.exp(-4 * Math.min(delta, 0.1));
      camera.position.lerp(data.position, blend);
      data.smoothedTarget.lerp(data.target, blend);
    }
    camera.up.set(0, 1, 0);
    camera.lookAt(data.smoothedTarget);
    data.initialized = true;
  });

  return tracking ? null : <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping minDistance={5} maxDistance={60} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.08} rotateSpeed={0.65} />;
}
