"use client";

import { memo, useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace } from "three";

const HOUSING_PAINT = {
  color: "#aeb8bd",
  metalness: 0.72,
  roughness: 0.27,
  clearcoat: 1,
  clearcoatRoughness: 0.2,
};

function createReflectionHighlight() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;
  // A small, static sky/ground highlight makes the metallic coating readable.
  // It is generated locally and requires no reflection camera or scene pass.
  const gradient = context.createLinearGradient(0, 0, 0, 64);
  gradient.addColorStop(0, "#91aebc");
  gradient.addColorStop(0.48, "#dce5e8");
  gradient.addColorStop(0.53, "#889a9e");
  gradient.addColorStop(1, "#53686f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Car forward is -X; both reflective faces point back toward +X. */
const SideMirror = memo(function SideMirror({ side }: { side: number }) {
  const designation = side > 0 ? "driver" : "passenger";
  const highlight = useMemo(createReflectionHighlight, []);
  useEffect(() => () => highlight?.dispose(), [highlight]);
  return <group name={`side-mirror-${designation}`}>
    <RoundedBox name={`mirror-mount-${designation}`} args={[0.15, 0.16, 0.075]} radius={0.02} smoothness={2} position={[-0.98, 1.3, side * 0.885]} rotation={[0, 0, -0.12]}>
      <meshStandardMaterial color="#26322f" roughness={0.68} metalness={0.12} />
    </RoundedBox>
    <RoundedBox name={`mirror-support-${designation}`} args={[0.24, 0.075, 0.2]} radius={0.025} smoothness={2} position={[-1.055, 1.315, side * 0.96]} rotation={[0, side * 0.3, -0.08]} castShadow>
      <meshStandardMaterial color="#34413f" roughness={0.5} metalness={0.3} />
    </RoundedBox>
    <group position={[-1.26, 1.38, side * 1.045]} rotation={[0, side * 0.12, 0]}>
      <RoundedBox name={`mirror-housing-${designation}`} args={[0.4, 0.23, 0.3]} radius={0.065} smoothness={3} position={[-0.025, 0.015, 0]} castShadow>
        <meshPhysicalMaterial {...HOUSING_PAINT} />
      </RoundedBox>
      <RoundedBox args={[0.37, 0.065, 0.275]} radius={0.025} smoothness={2} position={[-0.02, -0.084, 0]}>
        <meshStandardMaterial color="#293634" metalness={0.25} roughness={0.55} />
      </RoundedBox>
      <RoundedBox name={`mirror-bezel-${designation}`} args={[0.022, 0.19, 0.263]} radius={0.01} smoothness={2} position={[0.184, 0.02, 0]}>
        <meshStandardMaterial color="#182723" metalness={0.2} roughness={0.5} />
      </RoundedBox>
      {/* A separate rearward silver face stays outside the painted housing.
          Its slight inward cant makes it readable from the driver's eye. */}
      <RoundedBox name={`mirror-surface-${designation}`} args={[0.009, 0.158, 0.231]} radius={0.004} smoothness={2} position={[0.201, 0.022, 0]}>
        <meshPhysicalMaterial color="#bdcdd2" map={highlight} emissiveMap={highlight} emissive="#ffffff" emissiveIntensity={0.16} metalness={0.95} roughness={0.06} clearcoat={1} clearcoatRoughness={0.04} envMapIntensity={1.6} />
      </RoundedBox>
      <mesh position={[-0.05, -0.012, side * 0.149]}>
        <boxGeometry args={[0.2, 0.015, 0.007]} />
        <meshPhysicalMaterial color="#d2e1df" metalness={0.35} roughness={0.18} clearcoat={1} />
      </mesh>
    </group>
  </group>;
});

export default SideMirror;
