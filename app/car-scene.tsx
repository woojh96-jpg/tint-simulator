"use client";

import { Component, memo, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import { PerspectiveCamera, Quaternion, Shape, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import Glass, { type GlassPoints } from "./glass";
import DrivingEnvironment from "./driving-environment";
import { type FilmId, type TintSettings } from "./film-presets";

export type CameraView = "perspective" | "front" | "side" | "interior";
type Point = [number, number, number];
type QuadPoints = GlassPoints;

const FRONT_GLASS: QuadPoints = [[-1.12, 1.22, 0.86], [-0.48, 1.88, 0.73], [-0.48, 1.88, -0.73], [-1.12, 1.22, -0.86]];
const REAR_GLASS: QuadPoints = [[1.62, 1.22, -0.86], [1.02, 1.88, -0.73], [1.02, 1.88, 0.73], [1.62, 1.22, 0.86]];
const SIDE_GLASS: QuadPoints[] = [-1, 1].map((side) => [[-1.06, 1.23, side * 0.89], [-0.44, 1.87, side * 0.75], [0.18, 1.87, side * 0.75], [0.18, 1.23, side * 0.89]]);
const BACK_SIDE_GLASS: QuadPoints[] = [-1, 1].map((side) => [[0.27, 1.23, side * 0.89], [0.27, 1.87, side * 0.75], [0.98, 1.87, side * 0.75], [1.56, 1.23, side * 0.89]]);
const BODY_EXTRUDE = { depth: 1.76, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.075, bevelThickness: 0.075, curveSegments: 24 };
const PAINT = { color: "#aeb8bd", metalness: 0.72, roughness: 0.27, clearcoat: 1, clearcoatRoughness: 0.2 };

function Pillar({ from, to, radius = 0.035 }: { from: Point; to: Point; radius?: number }) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    return { midpoint: start.add(end).multiplyScalar(0.5), length: direction.length(), quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()) };
  }, [from, to]);
  return <mesh position={midpoint} quaternion={quaternion} castShadow><cylinderGeometry args={[radius, radius, length, 8]} /><meshPhysicalMaterial {...PAINT} /></mesh>;
}

const Wheel = memo(function Wheel({ x, z }: { x: number; z: number }) {
  const outer = z > 0 ? 0.155 : -0.155;
  return <group position={[x, 0.53, z]}>
    <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.51, 0.51, 0.25, 48]} /><meshStandardMaterial color="#151918" roughness={0.9} /></mesh>
    <mesh position={[0, 0, outer]}><torusGeometry args={[0.405, 0.093, 12, 48]} /><meshStandardMaterial color="#222725" roughness={0.85} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.336, 0.336, 0.29, 48]} /><meshStandardMaterial color="#242d30" metalness={0.7} roughness={0.32} /></mesh>
    <mesh position={[0, 0, outer * 1.06]}><torusGeometry args={[0.32, 0.022, 8, 48]} /><meshStandardMaterial color="#d4dedf" metalness={0.9} roughness={0.22} /></mesh>
    {Array.from({ length: 10 }, (_, index) => <group rotation={[0, 0, (index * Math.PI) / 5]} key={index}><mesh position={[0, 0.19, outer * 1.08]} rotation={[0, 0, -0.14]}><boxGeometry args={[0.045, 0.255, 0.025]} /><meshStandardMaterial color="#c5d0d4" metalness={0.85} roughness={0.25} /></mesh></group>)}
    <mesh position={[0, 0, outer * 1.17]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.025, 24]} /><meshStandardMaterial color="#88999e" metalness={0.85} roughness={0.22} /></mesh>
  </group>;
});

const CarInterior = memo(function CarInterior() {
  return (
    <group name="car-interior">
      <RoundedBox args={[2.55, 0.1, 1.59]} radius={0.045} position={[0.2, 1.14, 0]}>
        <meshStandardMaterial color="#252b29" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.17, 1.57]} radius={0.06} position={[-0.86, 1.29, 0]}>
        <meshStandardMaterial color="#2c3433" roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[0.035, 0.14, 0.36]} radius={0.015} position={[-0.607, 1.34, 0.4]}>
        <meshStandardMaterial color="#151e20" roughness={0.4} />
      </RoundedBox>
      {/* Driver instruments are simple inset geometry, with no font/image load. */}
      {[-0.085, 0.085].map((offset) => (
        <mesh key={offset} position={[-0.585, 1.345, 0.4 + offset]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.037, 0.043, 32]} />
          <meshBasicMaterial color="#a0b9ad" />
        </mesh>
      ))}
      <RoundedBox args={[0.027, 0.22, 0.28]} radius={0.012} position={[-0.6, 1.39, -0.06]}>
        <meshStandardMaterial color="#17282c" roughness={0.35} />
      </RoundedBox>
      <mesh position={[-0.58, 1.405, -0.06]}>
        <boxGeometry args={[0.005, 0.007, 0.16]} />
        <meshBasicMaterial color="#8ba99d" />
      </mesh>
      {[-0.43, 0.43].map((z) => (
        <group key={z} name={z > 0 ? "driver-seat" : "passenger-seat"}>
          <RoundedBox args={[0.3, 0.45, 0.45]} radius={0.085} position={[0.35, 1.38, z]} rotation={[0, 0, -0.15]}>
            <meshStandardMaterial color="#606963" roughness={0.93} />
          </RoundedBox>
          <RoundedBox args={[0.55, 0.12, 0.46]} radius={0.05} position={[0.12, 1.2, z]}>
            <meshStandardMaterial color="#737d73" roughness={0.93} />
          </RoundedBox>
          <RoundedBox args={[0.17, 0.17, 0.27]} radius={0.05} position={[0.38, 1.66, z]}>
            <meshStandardMaterial color="#606963" roughness={0.93} />
          </RoundedBox>
          <RoundedBox args={[0.7, 0.14, 0.045]} radius={0.018} position={[-0.12, 1.25, z > 0 ? 0.84 : -0.84]}>
            <meshStandardMaterial color="#343d38" roughness={0.75} />
          </RoundedBox>
        </group>
      ))}
      <RoundedBox args={[0.3, 0.4, 1.32]} radius={0.08} position={[1.12, 1.34, 0]}>
        <meshStandardMaterial color="#606963" roughness={0.93} />
      </RoundedBox>
      <RoundedBox args={[0.8, 0.12, 0.17]} radius={0.035} position={[0.02, 1.24, 0]}>
        <meshStandardMaterial color="#38413c" roughness={0.8} />
      </RoundedBox>
      <group name="steering-wheel" position={[-0.5, 1.39, 0.43]} rotation={[0, Math.PI / 2, -0.18]}>
        <mesh><torusGeometry args={[0.16, 0.025, 12, 36]} /><meshStandardMaterial color="#1f2824" roughness={0.7} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.055, 0.055, 0.035, 16]} /><meshStandardMaterial color="#37443e" /></mesh>
        <mesh><boxGeometry args={[0.27, 0.025, 0.025]} /><meshStandardMaterial color="#899b91" metalness={0.5} roughness={0.4} /></mesh>
        <mesh position={[0, -0.075, 0]}><boxGeometry args={[0.025, 0.12, 0.025]} /><meshStandardMaterial color="#899b91" metalness={0.5} roughness={0.4} /></mesh>
      </group>
    </group>
  );
});

const CarBody = memo(function CarBody() {
  const profile = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-2.44, 0.55); shape.lineTo(-2.46, 0.83);
    shape.quadraticCurveTo(-2.45, 0.98, -2.22, 1.02);
    shape.lineTo(-1.12, 1.12); shape.lineTo(1.35, 1.13); shape.lineTo(2.23, 1.03);
    shape.quadraticCurveTo(2.43, 1, 2.44, 0.83);
    shape.lineTo(2.43, 0.5); shape.lineTo(2.11, 0.49); shape.lineTo(2.11, 0.53);
    shape.absarc(1.55, 0.53, 0.56, 0, Math.PI, false);
    shape.lineTo(0.99, 0.43); shape.lineTo(-0.99, 0.43); shape.lineTo(-0.99, 0.53);
    shape.absarc(-1.55, 0.53, 0.56, 0, Math.PI, false);
    shape.lineTo(-2.11, 0.49); shape.closePath();
    return shape;
  }, []);
  return <group>
    <mesh position={[0, 0, -0.88]} castShadow receiveShadow><extrudeGeometry args={[profile, BODY_EXTRUDE]} /><meshPhysicalMaterial {...PAINT} /></mesh>
    <RoundedBox args={[1.56, 0.095, 1.53]} radius={0.045} position={[0.27, 1.92, 0]} castShadow><meshPhysicalMaterial {...PAINT} /></RoundedBox>
    <CarInterior />
    {[-1, 1].map((side) => <group key={side}>
      <Pillar from={[-1.14, 1.19, side * 0.9]} to={[-0.5, 1.9, side * 0.75]} radius={0.045} />
      <Pillar from={[1.66, 1.18, side * 0.9]} to={[1.03, 1.9, side * 0.75]} radius={0.055} />
      <Pillar from={[0.22, 1.2, side * 0.9]} to={[0.22, 1.9, side * 0.75]} radius={0.036} />
      <Pillar from={[-1.13, 1.19, side * 0.9]} to={[1.65, 1.19, side * 0.9]} radius={0.025} />
      <RoundedBox args={[0.25, 0.035, 0.035]} radius={0.015} position={[0.02, 1.04, side * 0.966]}><meshStandardMaterial color="#5c6a6c" metalness={0.85} roughness={0.25} /></RoundedBox>
      <RoundedBox args={[0.25, 0.035, 0.035]} radius={0.015} position={[1.01, 1.04, side * 0.966]}><meshStandardMaterial color="#5c6a6c" metalness={0.85} roughness={0.25} /></RoundedBox>
      <RoundedBox args={[0.3, 0.14, 0.18]} radius={0.06} position={[-0.83, 1.31, side * 1.04]} castShadow><meshPhysicalMaterial {...PAINT} /></RoundedBox>
      <mesh position={[0, 0.55, side * 0.93]}><boxGeometry args={[1.88, 0.075, 0.07]} /><meshStandardMaterial color="#34413f" metalness={0.6} roughness={0.4} /></mesh>
      <Wheel x={-1.55} z={side * 0.94} /><Wheel x={1.55} z={side * 0.94} />
      <Line points={[[0.24, 1.12, side * 0.96], [0.24, 0.64, side * 0.96], [0.15, 0.61, side * 0.96]]} color="#708084" lineWidth={0.7} />
      <Line points={[[-2.3, 1.045, side * 0.66], [-1.14, 1.153, side * 0.69]]} color="#88969b" lineWidth={0.65} />
    </group>)}
    <RoundedBox args={[0.04, 0.19, 1.25]} radius={0.019} position={[-2.555, 0.68, 0]}><meshStandardMaterial color="#283331" metalness={0.45} roughness={0.35} /></RoundedBox>
    <RoundedBox args={[0.035, 0.028, 1.51]} radius={0.012} position={[-2.52, 0.93, 0]}><meshStandardMaterial color="#edf9f6" emissive="#d5f7ef" emissiveIntensity={1.8} toneMapped={false} /></RoundedBox>
    {[-0.64, 0.64].map((z) => <RoundedBox key={z} args={[0.055, 0.075, 0.3]} radius={0.02} position={[-2.535, 0.9, z]}><meshStandardMaterial color="#f0fbff" emissive="#d4f5ff" emissiveIntensity={1.3} /></RoundedBox>)}
    <RoundedBox args={[0.035, 0.055, 1.58]} radius={0.015} position={[2.52, 0.92, 0]}><meshStandardMaterial color="#9c2524" emissive="#c13c30" emissiveIntensity={0.6} /></RoundedBox>
    <mesh position={[2.525, 0.62, 0]}><boxGeometry args={[0.025, 0.14, 1.28]} /><meshStandardMaterial color="#303c39" roughness={0.6} /></mesh>
  </group>;
});

function CameraControls({ view, viewRevision }: { view: CameraView; viewRevision: number }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = view === "interior" ? 70 : 32;
      camera.near = view === "interior" ? 0.025 : 0.1;
      camera.far = 120;
      camera.updateProjectionMatrix();
    }
    if (view === "interior") {
      // Ahead of the seat/headrest and behind the steering wheel, facing -X.
      // A slight leftward look also includes the driver's first-row side glass.
      camera.position.set(-0.18, 1.66, 0.39);
      camera.lookAt(-3.8, 1.5, 1.0);
      invalidate();
      return;
    }
    const fit = Math.max(1, 1.18 / (size.width / size.height));
    const positions: Record<Exclude<CameraView, "interior">, Point> = { perspective: [-6.4, 3.5, 5.8], front: [-8.7, 2.5, 0], side: [0, 2.8, 8.8] };
    const [x, y, z] = positions[view];
    camera.position.set(x * fit, (y - 0.85) * fit + 0.85, z * fit);
    camera.lookAt(0, 0.85, 0);
    controls.current?.target.set(0, 0.85, 0);
    controls.current?.update();
    invalidate();
  }, [camera, invalidate, size.width, size.height, view, viewRevision]);
  // Unmounting avoids OrbitControls' external distance clamps moving the
  // interior camera out of the cabin, even while controls would be disabled.
  if (view === "interior") return null;
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={5.5} maxDistance={15} minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI / 2.15} target={[0, 0.85, 0]} rotateSpeed={0.65} zoomSpeed={0.7} />;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="scene-loading" role="alert"><strong>3D 화면을 시작할 수 없습니다.</strong><span>WebGL을 지원하는 브라우저에서 하드웨어 가속을 켠 뒤 새로고침해 주세요.</span></div> : this.props.children;
  }
}

export default function CarScene({ filmId, tints, view, viewRevision }: {
  filmId: FilmId;
  tints: TintSettings;
  view: CameraView;
  viewRevision: number;
}) {
  const interior = view === "interior";
  return <SceneBoundary>
    <Canvas shadows dpr={[1, 1.5]} frameloop="demand" camera={{ position: [-6.4, 3.5, 5.8], fov: 32, near: 0.1, far: 120 }} gl={{ antialias: true, alpha: true }} fallback={<div className="scene-loading">이 브라우저는 3D 미리보기를 지원하지 않습니다.</div>}>
      {interior && <DrivingEnvironment />}
      <ambientLight intensity={0.6} /><hemisphereLight args={["#f4f8ff", "#8b9383", 1.4]} />
      <directionalLight position={[-3, 7, 4]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} shadow-normalBias={0.03} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <directionalLight position={[4, 3, -5]} intensity={1.8} color="#e5f0ff" />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={3} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 4, 1]} />
        <Lightformer intensity={2} position={[-4, 2, 4]} rotation={[0, Math.PI / 4, 0]} scale={[5, 3, 1]} />
        <Lightformer intensity={2.5} position={[3, 3, -4]} rotation={[0, -Math.PI / 4, 0]} scale={[6, 2, 1]} />
      </Environment>
      <CarBody />
      <Glass points={FRONT_GLASS} vlt={tints.front} filmId={filmId} zone="front" interior={interior} />
      <Glass points={REAR_GLASS} vlt={tints.rear} filmId={filmId} zone="rear" interior={interior} />
      {SIDE_GLASS.map((points, index) => <Glass key={`front-${index}`} points={points} vlt={tints.frontSide} filmId={filmId} zone="frontSide" interior={interior} />)}
      {BACK_SIDE_GLASS.map((points, index) => <Glass key={`rear-${index}`} points={points} vlt={tints.rearSide} filmId={filmId} zone="rearSide" interior={interior} />)}
      {!interior && <>
        <Line points={[...FRONT_GLASS, FRONT_GLASS[0]]} color="#a8c6b1" lineWidth={1.5} transparent opacity={0.65} />
        <ContactShadows position={[0, -0.01, 0]} opacity={0.42} scale={13} blur={2.8} far={4} resolution={256} color="#34423a" frames={1} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={0.1} /></mesh>
      </>}
      <CameraControls view={view} viewRevision={viewRevision} />
    </Canvas>
  </SceneBoundary>;
}
