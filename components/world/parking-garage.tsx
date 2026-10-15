"use client";

import { memo } from "react";
import { WORLD } from "../../lib/driving-config";
import { BoxBatch, ParkedCar, RoadArrow, StructureSign, parkingMarkings, type BoxPlacement } from "./world-primitives";

const PARKING_LINES = parkingMarkings(-74, 14, -5);
const COLUMNS: BoxPlacement[] = [-76, -86, -96, -106, -116].flatMap((x) => [-6.1, 6.1].map((z) => ({ position: [x, -3.3, z], scale: [0.58, 3.4, 0.58] })));
const COLUMN_BASES: BoxPlacement[] = COLUMNS.map(({ position }) => ({ position: [position[0], -4.46, position[2]], scale: [0.61, 1.08, 0.61] }));
const COLUMN_BANDS: BoxPlacement[] = COLUMNS.map(({ position }) => ({ position: [position[0], -3.9, position[2]], scale: [0.62, 0.13, 0.62] }));
const LED_POSITIONS = [-76, -84, -92, -100, -108, -116];
const LIGHT_HOUSINGS: BoxPlacement[] = LED_POSITIONS.flatMap((x) => [-2.8, 2.8].map((z) => ({ position: [x, -1.77, z], scale: [2.5, 0.13, 0.35] })));
const LIGHT_PANELS: BoxPlacement[] = LIGHT_HOUSINGS.map(({ position }) => ({ position: [position[0], position[1] - 0.075, position[2]], scale: [2.32, 0.025, 0.24] }));
const CEILING_BEAMS: BoxPlacement[] = [-76, -86, -96, -106, -116].map((x) => ({ position: [x, -1.9, 0], scale: [0.32, 0.3, 32] }));
const WALL_STRIPES: BoxPlacement[] = [-1, 1].map((side) => ({ position: [-96, -3.8, side * 16.05], scale: [50, 0.32, 0.035] }));
const WHEEL_STOPS: BoxPlacement[] = [-75.55, -81.75, -91.05, -100.35, -109.65, -115.85].flatMap((x) => [-1, 1].map((side) => ({ position: [x, -4.92, side * 12.45], scale: [1.75, 0.16, 0.23] })));

/** The route stays open along z ±4.5; all parking/columns sit outside it. */
const ParkingGarage = memo(function ParkingGarage({ interior }: { interior: boolean }) {
  return <group name="underground-parking">
    <mesh position={[-96, WORLD.GARAGE_Y - 0.15, 0]} receiveShadow>
      <boxGeometry args={[52, 0.3, 32.6]} />
      <meshStandardMaterial color="#69716f" roughness={0.96} />
    </mesh>
    <BoxBatch boxes={PARKING_LINES} color="#d7dbd5" />
    <BoxBatch boxes={WHEEL_STOPS} color="#c0b370" />
    <BoxBatch boxes={COLUMNS} color="#939b96" roughness={0.96} receiveShadow />
    <BoxBatch boxes={COLUMN_BASES} color="#455951" />
    <BoxBatch boxes={COLUMN_BANDS} color="#d6ce8b" />
    <BoxBatch boxes={[
      { position: [-122, -3.3, 0], scale: [0.32, 3.4, 32.6] },
      { position: [-96, -3.3, -16.3], scale: [52, 3.4, 0.32] },
      { position: [-96, -3.3, 16.3], scale: [52, 3.4, 0.32] },
      { position: [-70, -3.3, -10.5], scale: [0.3, 3.4, 11.4] },
      { position: [-70, -3.3, 10.5], scale: [0.3, 3.4, 11.4] },
    ]} color="#88918c" roughness={0.94} opacity={interior ? 1 : 0.34} />
    <BoxBatch boxes={WALL_STRIPES} color="#46655d" />
    <BoxBatch boxes={[{ position: [-96, -1.54, 0], scale: [52, 0.2, 32.6] }]} color="#737c77" opacity={interior ? 1 : 0.075} />
    <BoxBatch boxes={CEILING_BEAMS} color="#69766f" opacity={interior ? 1 : 0.12} />
    <BoxBatch boxes={LIGHT_HOUSINGS} color="#485851" />
    <BoxBatch boxes={LIGHT_PANELS} color="#e1eddf" emissive="#d4e9df" emissiveIntensity={2.2} />
    {/* Twelve visible LED fixtures share only two actual lights. */}
    <pointLight position={[-83, -2.2, 0]} intensity={32} distance={24} decay={2} color="#d9e7dd" />
    <pointLight position={[-106, -2.2, 0]} intensity={32} distance={25} decay={2} color="#d9e7dd" />
    {[-78, -94, -110].map((x) => <RoadArrow key={x} x={x} y={-4.98} />)}
    <StructureSign position={[-71, -2.55, 0]} label="B1" rotation={Math.PI / 2} scale={1.25} />
    <StructureSign position={[-121.8, -2.65, 0]} label="B1" rotation={Math.PI / 2} scale={1.8} />
    {[-79, -89, -99, -109].flatMap((x, index) => [-1, 1].map((side) => <StructureSign key={`${x}-${side}`} position={[x, -3.1, side * 16.1]} label={`0${index + 1}`} rotation={side > 0 ? Math.PI : 0} scale={0.8} />))}
    <ParkedCar x={-75.55} y={-5} z={10.2} color="#aeb6ad" />
    <ParkedCar x={-84.85} y={-5} z={-10.2} color="#526776" />
    <ParkedCar x={-97.25} y={-5} z={10.2} color="#b3a38a" />
    <ParkedCar x={-109.65} y={-5} z={-10.2} color="#899d91" />
  </group>;
});

export default ParkingGarage;
