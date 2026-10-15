"use client";

import { memo } from "react";
import { WORLD, getRoadHeight } from "../../lib/driving-config";
import ParkingGarage from "./parking-garage";
import { BoxBatch, ParkedCar, RoadArrow, StructureSign, parkingMarkings, type BoxPlacement } from "./world-primitives";

const ROAD_MARKINGS: BoxPlacement[] = [
  ...Array.from({ length: 8 }, (_, index): BoxPlacement => ({ position: [27 - index * 5, 0.014, -2.3], scale: [2.4, 0.015, 0.1] })),
  ...[-4.3, 4.3].map((z): BoxPlacement => ({ position: [10, 0.014, z], scale: [40, 0.015, 0.1] })),
];
const BUILDINGS: BoxPlacement[] = [-1, 1].flatMap((side) => [25, 11, -4].map((x, index) => ({ position: [x, 2.3 + index * 0.55, side * (20 + index % 2 * 2)], scale: [8.5, 4.6 + index * 1.1, 8] })));
const WINDOWS: BoxPlacement[] = BUILDINGS.flatMap(({ position, scale }) => Array.from({ length: 5 }, (_, index) => ({ position: [position[0] - 3 + index * 1.5, position[1] + 0.3, position[2] + (position[2] > 0 ? -1 : 1) * (scale[2] / 2 + 0.015)], scale: [0.8, 1.8, 0.025] })));
const SURFACE_MARKINGS = parkingMarkings(-12, 7, 0);
const SURFACE_COLUMNS: BoxPlacement[] = [-15, -24, -34].flatMap((x) => [-6.3, 6.3].map((z) => ({ position: [x, 2.2, z], scale: [0.45, 4.4, 0.45] })));
const SURFACE_BEAMS: BoxPlacement[] = [-15, -24, -34].map((x) => ({ position: [x, 4.24, 0], scale: [0.32, 0.3, 30] }));
const STREET_LAMPS: BoxPlacement[] = [-5, 13, 27].flatMap((x) => [-1, 1].flatMap((side): BoxPlacement[] => [
  { position: [x, 2.65, side * 8.2], scale: [0.1, 5.3, 0.1] },
  { position: [x, 5.3, side * 7.5], scale: [0.13, 0.12, 1.5] },
]));
const LAMP_HEADS: BoxPlacement[] = [-5, 13, 27].flatMap((x) => [-1, 1].map((side) => ({ position: [x, 5.25, side * 6.85], scale: [0.55, 0.1, 0.32] })));
const TREE_LOCATIONS = [-1, 1].flatMap((side) => [25, 17, 7, -2].map((x, index) => ({ x, z: side * (11.5 + index % 2), size: 1 + index % 2 * 0.15 })));

const OutdoorRoad = memo(function OutdoorRoad() {
  return <group name="outdoor-road">
    <mesh position={[11, -0.18, 0]} receiveShadow><boxGeometry args={[46, 0.32, 58]} /><meshStandardMaterial color="#a5b090" roughness={1} /></mesh>
    <mesh position={[10, -0.08, 0]} receiveShadow><boxGeometry args={[40, 0.16, 12]} /><meshStandardMaterial color="#737e7d" roughness={0.96} /></mesh>
    <BoxBatch boxes={ROAD_MARKINGS} color="#e5e6d8" />
    <BoxBatch boxes={[-1, 1].map((side) => ({ position: [10, 0.1, side * 6.9], scale: [40, 0.2, 1.8] }))} color="#c2c7ba" receiveShadow />
    <BoxBatch boxes={[-1, 1].map((side) => ({ position: [10, 0.12, side * 5.98], scale: [40, 0.24, 0.16] }))} color="#e2e4d7" />
    <BoxBatch boxes={BUILDINGS} color="#d1d3c7" receiveShadow />
    <BoxBatch boxes={WINDOWS} color="#6a8487" metalness={0.35} roughness={0.35} />
    <BoxBatch boxes={STREET_LAMPS} color="#5a6964" metalness={0.3} />
    <BoxBatch boxes={LAMP_HEADS} color="#e0e8d7" emissive="#dbe7ce" emissiveIntensity={0.25} />
    {TREE_LOCATIONS.map(({ x, z, size }, index) => <group key={index} position={[x, 0, z]} scale={size}>
      <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.11, 0.17, 2.1, 6]} /><meshStandardMaterial color="#817b62" roughness={1} /></mesh>
      <mesh position={[0, 2.65, 0]} scale={[1, 1.25, 1]}><icosahedronGeometry args={[1.5, 0]} /><meshStandardMaterial color={index % 2 ? "#718b6e" : "#839979"} roughness={1} /></mesh>
    </group>)}
    <RoadArrow x={16} y={0.025} />
    <StructureSign position={[-7, 2.4, -5.5]} label="P" rotation={Math.PI / 2} scale={1.5} />
    <mesh position={[-7, 0.9, -5.5]}><boxGeometry args={[0.1, 1.8, 0.1]} /><meshStandardMaterial color="#69796e" /></mesh>
  </group>;
});

const SurfaceParking = memo(function SurfaceParking({ interior }: { interior: boolean }) {
  return <group name="surface-parking">
    <mesh position={[-24, -0.15, 0]} receiveShadow><boxGeometry args={[28, 0.3, 32.6]} /><meshStandardMaterial color="#a0a89c" roughness={0.96} /></mesh>
    <mesh position={[-24, 0.003, 0]} receiveShadow><boxGeometry args={[28, 0.006, 9]} /><meshStandardMaterial color="#7d8880" roughness={0.94} /></mesh>
    <BoxBatch boxes={SURFACE_MARKINGS} color="#e3e4d8" />
    <BoxBatch boxes={SURFACE_COLUMNS} color="#aab2a3" receiveShadow />
    <BoxBatch boxes={SURFACE_BEAMS} color="#8e9e8f" opacity={interior ? 1 : 0.22} />
    {/* Open sides retain daylight; the roof fades in external camera modes. */}
    <BoxBatch boxes={[{ position: [-25, 4.5, 0], scale: [23, 0.18, 30] }]} color="#b6c0ac" opacity={interior ? 1 : 0.1} />
    <BoxBatch boxes={[-1, 1].map((side) => ({ position: [-24, 0.2, side * 16.2], scale: [28, 0.4, 0.3] }))} color="#bec5b4" />
    <ParkedCar x={-16.65} y={0} z={10.2} color="#d0d0bd" />
    <ParkedCar x={-25.95} y={0} z={-10.2} color="#7b9293" />
    <RoadArrow x={-20} y={0.025} />
    <RoadArrow x={-32} y={0.025} />
    <StructureSign position={[-14, 3.55, 0]} label="L1" rotation={Math.PI / 2} scale={1.3} />
    <StructureSign position={[-36, 2.25, -5.1]} label="B1" rotation={Math.PI / 2} scale={1.35} />
  </group>;
});

function createRamp() {
  const floor: BoxPlacement[] = [];
  const walls: BoxPlacement[] = [];
  const roofs: BoxPlacement[] = [];
  const edgeLines: BoxPlacement[] = [];
  const reflectors: BoxPlacement[] = [];
  const count = 32;
  const step = (WORLD.RAMP_START - WORLD.RAMP_END) / count;
  for (let index = 0; index < count; index++) {
    const xA = WORLD.RAMP_START - (index + 1) * step;
    const xB = WORLD.RAMP_START - index * step;
    const yA = getRoadHeight(xA);
    const yB = getRoadHeight(xB);
    const slope = Math.atan2(yB - yA, step);
    const x = (xA + xB) / 2;
    const y = (yA + yB) / 2;
    const length = Math.hypot(step, yB - yA) + 0.015;
    const rotation: [number, number, number] = [0, 0, slope];
    floor.push({ position: [x, y - 0.1, 0], scale: [length, 0.2, WORLD.RAMP_HALF_WIDTH * 2], rotation });
    roofs.push({ position: [x, y + 3.5, 0], scale: [length, 0.2, WORLD.RAMP_HALF_WIDTH * 2 + 0.48], rotation });
    for (const side of [-1, 1]) {
      walls.push({ position: [x, y + 1.7, side * (WORLD.RAMP_HALF_WIDTH + 0.13)], scale: [length, 3.4, 0.26], rotation });
      edgeLines.push({ position: [x, y + 0.018, side * 3.94], scale: [length, 0.015, 0.09], rotation });
      if (index % 3 === 0) reflectors.push({ position: [x, y + 0.62, side * (WORLD.RAMP_HALF_WIDTH - 0.025)], scale: [0.26, 0.08, 0.025] });
    }
  }
  return { floor, walls, roofs, edgeLines, reflectors };
}

const RAMP = createRamp();
const RAMP_LED: BoxPlacement[] = [-42, -50, -58, -66].map((x) => ({ position: [x, getRoadHeight(x) + 3.28, 0], scale: [0.28, 0.055, 2.8] }));

const EntranceRamp = memo(function EntranceRamp({ interior }: { interior: boolean }) {
  return <group name="underground-entrance-ramp">
    <BoxBatch boxes={RAMP.floor} color="#7c8781" receiveShadow />
    <BoxBatch boxes={RAMP.walls} color="#9aa397" opacity={interior ? 1 : 0.24} />
    <BoxBatch boxes={RAMP.roofs} color="#7e8b7f" opacity={interior ? 1 : 0.075} />
    <BoxBatch boxes={RAMP.edgeLines} color="#e0e3ce" />
    <BoxBatch boxes={RAMP.reflectors} color="#d9c97a" emissive="#c6bb82" emissiveIntensity={0.55} />
    <BoxBatch boxes={RAMP_LED} color="#e5efde" emissive="#d4e8d8" emissiveIntensity={1.4} />
    <pointLight position={[-57, getRoadHeight(-57) + 2.75, 0]} intensity={12} distance={17} decay={2} color="#d5e3d4" />
    <StructureSign position={[-38.1, 2.8, 0]} label="B1" rotation={Math.PI / 2} scale={1.25} />
    {[-45, -56, -66].map((x) => <group key={x} position={[x, getRoadHeight(x) + 0.025, 0]} rotation={[0, 0, Math.atan2(getRoadHeight(x + 0.1) - getRoadHeight(x - 0.1), 0.2)]}><RoadArrow x={0} y={0} /></group>)}
  </group>;
});

/** One connected world; its roofs open visually for external inspection. */
const DrivingWorld = memo(function DrivingWorld({ interior }: { interior: boolean }) {
  return <group name="driving-world">
    <OutdoorRoad />
    <SurfaceParking interior={interior} />
    <EntranceRamp interior={interior} />
    <ParkingGarage interior={interior} />
  </group>;
});

export default DrivingWorld;
