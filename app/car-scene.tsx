"use client";

import { Component, memo, useRef, type ReactNode, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import CarRig, { type DrivingTelemetry } from "../components/car/car-rig";
import DrivingCamera, { type CameraView } from "../components/car/driving-camera";
import DrivingWorld from "../components/world/driving-world";
import WorldLighting from "../components/world/world-lighting";
import { createDrivingState, type DriveInput } from "../lib/driving-config";
import type { FilmId, TintSettings } from "./film-presets";

export type { CameraView, DrivingTelemetry };

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-loading" role="alert"><strong>3D 화면을 시작할 수 없습니다.</strong><span>WebGL을 지원하는 브라우저에서 하드웨어 가속을 켠 뒤 새로고침해 주세요.</span></div> : this.props.children;
  }
}

const CarScene = memo(function CarScene({ filmId, tints, view, viewRevision, drivingEnabled, inputRef, resetRevision, onTelemetry }: {
  filmId: FilmId;
  tints: TintSettings;
  view: CameraView;
  viewRevision: number;
  drivingEnabled: boolean;
  inputRef: RefObject<DriveInput>;
  resetRevision: number;
  onTelemetry: (value: DrivingTelemetry) => void;
}) {
  const stateRef = useRef(createDrivingState());
  const interior = view === "interior";
  return (
    <SceneBoundary>
      <Canvas
        shadows
        dpr={[1, 1.25]}
        camera={{ position: [26.5, 4.1, 3.1], fov: 50, near: 0.1, far: 230 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        fallback={<div className="scene-loading">이 브라우저는 3D 미리보기를 지원하지 않습니다.</div>}
      >
        <DrivingWorld interior={interior} />
        <WorldLighting stateRef={stateRef} />
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={3} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 4, 1]} />
          <Lightformer intensity={2} position={[-4, 2, 4]} rotation={[0, Math.PI / 4, 0]} scale={[5, 3, 1]} />
          <Lightformer intensity={2.5} position={[3, 3, -4]} rotation={[0, -Math.PI / 4, 0]} scale={[6, 2, 1]} />
        </Environment>
        <CarRig stateRef={stateRef} inputRef={inputRef} drivingEnabled={drivingEnabled} resetRevision={resetRevision} filmId={filmId} tints={tints} interior={interior} onTelemetry={onTelemetry} />
        <DrivingCamera stateRef={stateRef} view={view} viewRevision={viewRevision} resetRevision={resetRevision} />
      </Canvas>
    </SceneBoundary>
  );
});

export default CarScene;
