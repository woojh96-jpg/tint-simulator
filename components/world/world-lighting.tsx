"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AmbientLight, Color, DirectionalLight, Fog, HemisphereLight, Object3D } from "three";
import { getZoneLighting, type DrivingState } from "../../lib/driving-config";

export default function WorldLighting({ stateRef }: { stateRef: RefObject<DrivingState> }) {
  const ambient = useRef<AmbientLight>(null);
  const hemisphere = useRef<HemisphereLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  const colors = useRef({ background: new Color(), fog: new Color() });
  useFrame(({ scene }, delta) => {
    const state = stateRef.current;
    const lighting = getZoneLighting(state.x);
    const blend = 1 - Math.exp(-2.8 * Math.min(delta, 0.1));
    if (ambient.current) ambient.current.intensity += (lighting.ambient - ambient.current.intensity) * blend;
    if (hemisphere.current) hemisphere.current.intensity += (lighting.hemisphere - hemisphere.current.intensity) * blend;
    if (sun.current && target.current) {
      sun.current.intensity += (lighting.sun - sun.current.intensity) * blend;
      sun.current.position.set(state.x + 9, state.y + 18, state.z + 9);
      target.current.position.set(state.x, state.y, state.z);
      sun.current.target = target.current;
      target.current.updateMatrixWorld();
    }
    // Material envMapIntensity is product-specific; scene intensity supplies
    // the smoothly changing environmental reflection/light level.
    scene.environmentIntensity += (lighting.environment - scene.environmentIntensity) * blend;
    if (scene.background instanceof Color) scene.background.lerp(colors.current.background.set(lighting.background), blend);
    if (scene.fog instanceof Fog) {
      scene.fog.color.lerp(colors.current.fog.set(lighting.fog), blend);
      scene.fog.near += (lighting.fogNear - scene.fog.near) * blend;
      scene.fog.far += (lighting.fogFar - scene.fog.far) * blend;
    }
  }, -2);

  return <>
    <color attach="background" args={["#cbdde7"]} />
    <fog attach="fog" args={["#cbdde7", 45, 180]} />
    <ambientLight ref={ambient} intensity={0.75} />
    <hemisphereLight ref={hemisphere} args={["#e3f1ff", "#686b58", 1.3]} />
    <object3D ref={target} />
    <directionalLight ref={sun} intensity={2.7} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0005} shadow-normalBias={0.03} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={55} />
  </>;
}
