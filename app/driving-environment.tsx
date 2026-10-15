"use client";

import { memo } from "react";

// A small procedural streetscape provides light, shade and a visible horizon
// through the cabin windows. It uses no images, textures or external models.
const DrivingEnvironment = memo(function DrivingEnvironment() {
  return (
    <>
      <color attach="background" args={["#c9d9e1"]} />
      <fog attach="fog" args={["#c9d9e1", 30, 95]} />
      <group name="interior-preview-environment">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#a3ad8e" roughness={1} />
      </mesh>
      <mesh position={[-35, -0.035, 0]} receiveShadow>
        <boxGeometry args={[90, 0.025, 7.2]} />
        <meshStandardMaterial color="#858b8b" roughness={1} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={index} position={[-7 - index * 6, -0.015, -1.8]}>
          <boxGeometry args={[3, 0.012, 0.12]} />
          <meshStandardMaterial color="#ecebdc" roughness={1} />
        </mesh>
      ))}
      {[-3.45, 3.45].map((z) => (
        <mesh key={z} position={[-35, -0.015, z]}>
          <boxGeometry args={[90, 0.012, 0.1]} />
          <meshStandardMaterial color="#e6e7df" roughness={1} />
        </mesh>
      ))}
      {[-1, 1].flatMap((side) => Array.from({ length: 7 }, (_, index) => (
        <group key={`${side}-${index}`} position={[-8 - index * 8, 0, side * (6.5 + (index % 2) * 0.8)]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.13, 0.2, 2.2, 8]} />
            <meshStandardMaterial color="#7d7764" roughness={1} />
          </mesh>
          <mesh position={[0, 3, 0]} scale={[1, 1.35, 1]}>
            <icosahedronGeometry args={[1.35, 1]} />
            <meshStandardMaterial color={index % 2 ? "#7c9474" : "#8b9f7e"} roughness={1} />
          </mesh>
        </group>
      )))}
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-18 - index * 8, 2 + (index % 3), -12 - (index % 2) * 6]}>
          <boxGeometry args={[4 + (index % 2) * 2, 4 + (index % 3) * 2, 4]} />
          <meshStandardMaterial color={index % 2 ? "#c3c8c4" : "#d8d9d0"} roughness={0.85} />
        </mesh>
      ))}
      </group>
    </>
  );
});

export default DrivingEnvironment;
