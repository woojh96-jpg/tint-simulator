"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Object3D } from "three";
import Glass from "../../app/glass";
import type { FilmId, TintSettings } from "../../app/film-presets";
import { WORLD, createDrivingState, getDrivingZone, stepDrivingState, type DriveInput, type DrivingState, type DrivingZone } from "../../lib/driving-config";
import { BACK_SIDE_GLASS, CarBody, FRONT_GLASS, REAR_GLASS, SIDE_GLASS } from "./car-model";

export type DrivingTelemetry = {
  zone: DrivingZone;
  speed: number;
  x: number;
  z: number;
  height: number;
};

export default function CarRig({ stateRef, inputRef, drivingEnabled, resetRevision, filmId, tints, interior, onTelemetry }: {
  stateRef: RefObject<DrivingState>;
  inputRef: RefObject<DriveInput>;
  drivingEnabled: boolean;
  resetRevision: number;
  filmId: FilmId;
  tints: TintSettings;
  interior: boolean;
  onTelemetry: (value: DrivingTelemetry) => void;
}) {
  const group = useRef<Group>(null);
  const wheels = useRef<{ roll: Object3D[]; steer: Object3D[] }>({ roll: [], steer: [] });
  const reporting = useRef({ elapsed: 1, zone: "outdoor" as DrivingZone });

  useEffect(() => {
    const roll: Object3D[] = [];
    const steer: Object3D[] = [];
    group.current?.traverse((object) => {
      if (object.name === "wheel-roll") roll.push(object);
      if (object.name === "front-wheel-steer") steer.push(object);
    });
    wheels.current = { roll, steer };
  }, []);

  useEffect(() => {
    Object.assign(stateRef.current, createDrivingState());
    reporting.current.elapsed = 1;
  }, [resetRevision, stateRef]);

  useFrame((_, delta) => {
    const state = stateRef.current;
    stepDrivingState(state, inputRef.current, delta, drivingEnabled);
    if (group.current) {
      group.current.position.set(state.x, state.y, state.z);
      group.current.rotation.set(0, state.heading, state.pitch, "YXZ");
      // Cameras consume this matrix later in the same frame.
      group.current.updateMatrixWorld(true);
    }
    for (const wheel of wheels.current.roll) wheel.rotation.set(0, 0, (state.distance / WORLD.TIRE_RADIUS) % (Math.PI * 2));
    for (const wheel of wheels.current.steer) wheel.rotation.set(0, state.steering, 0);

    const zone = getDrivingZone(state.x);
    reporting.current.elapsed += delta;
    if (reporting.current.elapsed >= 0.2 || reporting.current.zone !== zone) {
      reporting.current = { elapsed: 0, zone };
      onTelemetry({ zone, speed: state.speed, x: state.x, z: state.z, height: state.y });
    }
  }, -3);

  return (
    <group ref={group} name="drivable-car-rig" position={[18, 0, 0]}>
      <CarBody />
      <Glass points={FRONT_GLASS} vlt={tints.front} filmId={filmId} zone="front" interior={interior} />
      <Glass points={REAR_GLASS} vlt={tints.rear} filmId={filmId} zone="rear" interior={interior} />
      {SIDE_GLASS.map((points, index) => <Glass key={`front-${index}`} points={points} vlt={tints.frontSide} filmId={filmId} zone="frontSide" interior={interior} />)}
      {BACK_SIDE_GLASS.map((points, index) => <Glass key={`rear-${index}`} points={points} vlt={tints.rearSide} filmId={filmId} zone="rearSide" interior={interior} />)}
    </group>
  );
}
