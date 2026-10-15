"use client";

import { useMemo } from "react";
import { AddEquation, Color, CustomBlending, DoubleSide, OneFactor, SrcColorFactor, ZeroFactor } from "three";
import { FILMS, getGlassAppearance, getInteriorLightTransmission, type FilmId, type TintZone } from "./film-presets";

export type GlassPoints = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

const QUAD_INDICES = new Uint16Array([0, 1, 2, 0, 2, 3]);
const FILTER_VERTEX_SHADER = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FILTER_FRAGMENT_SHADER = `
  uniform vec3 lightFilter;
  void main() {
    gl_FragColor = vec4(lightFilter, 1.0);
  }
`;

export default function Glass({ points, vlt, filmId, zone, interior }: {
  points: GlassPoints;
  vlt: number;
  filmId: FilmId;
  zone: TintZone;
  interior: boolean;
}) {
  const positions = useMemo(() => new Float32Array(points.flat()), [points]);
  const appearance = getGlassAppearance(vlt, filmId);
  const uniforms = useMemo(() => ({
    lightFilter: {
      value: new Color(FILMS[filmId].interiorTint)
        .lerp(new Color("#ffffff"), 0.7)
        .multiplyScalar(getInteriorLightTransmission(vlt)),
    },
  }), [filmId, vlt]);

  return (
    <mesh name={`glass-${zone}`} userData={{ zone, vlt, filmId }} renderOrder={interior ? 10 : 0}>
      <bufferGeometry onUpdate={(geometry) => geometry.computeVertexNormals()}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="index" args={[QUAD_INDICES, 1]} />
      </bufferGeometry>
      {interior ? (
        // Each pane multiplies the already lit world. Zone lighting changes the
        // incoming daylight/LED light before this product's transmission filter.
        // This changes
        // transmitted light without painting a dark overlay over the dashboard.
        // A single pass avoids applying the filter twice to double-sided glass.
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={FILTER_VERTEX_SHADER}
          fragmentShader={FILTER_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          side={DoubleSide}
          forceSinglePass
          toneMapped={false}
          blending={CustomBlending}
          blendEquation={AddEquation}
          blendSrc={ZeroFactor}
          blendDst={SrcColorFactor}
          blendSrcAlpha={ZeroFactor}
          blendDstAlpha={OneFactor}
        />
      ) : (
        <meshPhysicalMaterial
          {...appearance}
          transparent
          side={DoubleSide}
          depthWrite={false}
          forceSinglePass
          thickness={0.01}
          clearcoatRoughness={0.16}
        />
      )}
    </mesh>
  );
}
