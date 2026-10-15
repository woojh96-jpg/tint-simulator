"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";

export type BoxPlacement = {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
};

/** Repeated markings and structure share one draw call per material. */
export const BoxBatch = memo(function BoxBatch({
  boxes,
  color,
  roughness = 0.9,
  metalness = 0,
  emissive,
  emissiveIntensity = 0,
  opacity = 1,
  receiveShadow = false,
}: {
  boxes: BoxPlacement[];
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  receiveShadow?: boolean;
}) {
  const instances = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = instances.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    const euler = new Euler();
    boxes.forEach((box, index) => {
      position.set(...box.position);
      quaternion.setFromEuler(euler.set(...(box.rotation ?? [0, 0, 0])));
      scale.set(...box.scale);
      mesh.setMatrixAt(index, matrix.compose(position, quaternion, scale));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [boxes]);
  if (!boxes.length) return null;
  return (
    <instancedMesh ref={instances} args={[undefined, undefined, boxes.length]} receiveShadow={receiveShadow}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive} emissiveIntensity={emissiveIntensity} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
    </instancedMesh>
  );
});

export function parkingMarkings(startX: number, count: number, floor: number): BoxPlacement[] {
  const boxes: BoxPlacement[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index <= count; index++) {
      boxes.push({ position: [startX - index * 3.1, floor + 0.013, side * 10.1], scale: [0.085, 0.014, 6.2] });
    }
    boxes.push({ position: [startX - count * 1.55, floor + 0.013, side * 13.2], scale: [count * 3.1, 0.014, 0.085] });
  }
  return boxes;
}

/** Paint points toward local -X, the direction of travel into the garage. */
export function RoadArrow({ x, y, z = 0, color = "#d9dfd9" }: { x: number; y: number; z?: number; color?: string }) {
  const boxes: BoxPlacement[] = [
    { position: [x + 0.32, y, z], scale: [1.3, 0.015, 0.17] },
    { position: [x - 0.46, y, z - 0.25], scale: [0.8, 0.015, 0.17], rotation: [0, Math.PI / 4, 0] },
    { position: [x - 0.46, y, z + 0.25], scale: [0.8, 0.015, 0.17], rotation: [0, -Math.PI / 4, 0] },
  ];
  return <BoxBatch boxes={boxes} color={color} />;
}

const GLYPHS: Record<string, string[]> = {
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
};

/** Built from geometry so signs never request a remote font or image. */
export const StructureSign = memo(function StructureSign({
  position,
  label,
  rotation = 0,
  scale = 1,
  color = "#e4eddf",
}: {
  position: [number, number, number];
  label: string;
  rotation?: number;
  scale?: number;
  color?: string;
}) {
  const pixels: BoxPlacement[] = [];
  const spacing = 0.074;
  const width = label.length * 6 * spacing;
  for (const [characterIndex, character] of [...label].entries()) {
    GLYPHS[character]?.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel === "1") pixels.push({
          position: [(characterIndex * 6 + columnIndex) * spacing - width / 2 + spacing, (3 - rowIndex) * spacing, 0.047],
          scale: [spacing * 0.89, spacing * 0.89, 0.012],
        });
      });
    });
  }
  return <group position={position} rotation={[0, rotation, 0]} scale={scale}>
    <mesh><boxGeometry args={[width + 0.24, 0.76, 0.075]} /><meshStandardMaterial color="#223730" roughness={0.65} /></mesh>
    <BoxBatch boxes={pixels} color={color} emissive={color} emissiveIntensity={0.35} />
  </group>;
});

export const ParkedCar = memo(function ParkedCar({ x, y, z, color }: { x: number; y: number; z: number; color: string }) {
  return <group position={[x, y, z]} rotation={[0, Math.PI / 2, 0]}>
    <mesh position={[0, 0.65, 0]}><boxGeometry args={[4.1, 0.78, 1.75]} /><meshStandardMaterial color={color} roughness={0.46} metalness={0.3} /></mesh>
    <mesh position={[0.15, 1.22, 0]}><boxGeometry args={[2.2, 0.56, 1.48]} /><meshStandardMaterial color="#263d43" roughness={0.28} metalness={0.25} /></mesh>
    <mesh position={[0.15, 1.52, 0]}><boxGeometry args={[2.27, 0.075, 1.55]} /><meshStandardMaterial color={color} roughness={0.46} metalness={0.3} /></mesh>
    {[-1.3, 1.3].flatMap((wheelX) => [-0.87, 0.87].map((wheelZ) => <mesh key={`${wheelX}-${wheelZ}`} position={[wheelX, 0.39, wheelZ]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.39, 0.39, 0.18, 10]} /><meshStandardMaterial color="#1c2327" roughness={0.9} /></mesh>))}
  </group>;
});
