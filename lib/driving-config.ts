export type DrivingZone = "outdoor" | "surfaceParking" | "ramp" | "underground";

export type DriveInput = {
  forward: boolean;
  reverse: boolean;
  left: boolean;
  right: boolean;
};

export type DrivingState = {
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  speed: number;
  steering: number;
  distance: number;
};

export const WORLD = Object.freeze({
  OUTDOOR_END: -10,
  RAMP_START: -38,
  RAMP_END: -70,
  GARAGE_Y: -5,
  MIN_X: -116,
  MAX_X: 26,
  OUTDOOR_HALF_WIDTH: 12,
  SURFACE_HALF_WIDTH: 14,
  GARAGE_HALF_WIDTH: 14,
  RAMP_HALF_WIDTH: 4.5,
  DRIVE_RAMP_HALF_WIDTH: 3.15,
  INITIAL_X: 18,
  WHEELBASE: 2.7,
  TIRE_RADIUS: 0.51,
  MAX_FORWARD_SPEED: 6,
  MAX_REVERSE_SPEED: 3,
});

export const ZONE_LABELS: Record<DrivingZone, string> = {
  outdoor: "야외 도로",
  surfaceParking: "지상 주차장",
  ramp: "지하 진입 램프",
  underground: "지하주차장",
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const smoothstep = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function createDrivingState(): DrivingState {
  return { x: WORLD.INITIAL_X, y: 0, z: 0, heading: 0, pitch: 0, speed: 0, steering: 0, distance: 0 };
}

export function getDrivingZone(x: number): DrivingZone {
  if (x >= WORLD.OUTDOOR_END) return "outdoor";
  if (x >= WORLD.RAMP_START) return "surfaceParking";
  if (x > WORLD.RAMP_END) return "ramp";
  return "underground";
}

export function getRoadHeight(x: number): number {
  const progress = (WORLD.RAMP_START - x) / (WORLD.RAMP_START - WORLD.RAMP_END);
  return progress <= 0 ? 0 : WORLD.GARAGE_Y * smoothstep(progress);
}

// Positive local Z rotation tips the car's local -X nose down the ramp.
export function getRoadPitch(x: number): number {
  const length = WORLD.RAMP_START - WORLD.RAMP_END;
  const t = clamp((WORLD.RAMP_START - x) / length, 0, 1);
  return Math.atan((-WORLD.GARAGE_Y * 6 * t * (1 - t)) / length);
}

export type ZoneLighting = {
  ambient: number;
  hemisphere: number;
  sun: number;
  environment: number;
  background: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  brightness: number;
};

const OUTDOOR_LIGHT: ZoneLighting = {
  ambient: 0.65, hemisphere: 1.15, sun: 2.7, environment: 1.1,
  background: "#cedde5", fog: "#cedde5", fogNear: 65, fogFar: 210, brightness: 1,
};
const SURFACE_LIGHT: ZoneLighting = {
  ambient: 0.44, hemisphere: 0.72, sun: 1.3, environment: 0.72,
  background: "#aebfc8", fog: "#b0bdc5", fogNear: 42, fogFar: 160, brightness: 0.75,
};
const GARAGE_LIGHT: ZoneLighting = {
  ambient: 0.16, hemisphere: 0.16, sun: 0.01, environment: 0.24,
  background: "#111820", fog: "#172026", fogNear: 12, fogFar: 82, brightness: 0.22,
};

function blendColor(from: string, to: string, t: number): string {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
  const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
  const blue = Math.round((a & 255) * (1 - t) + (b & 255) * t);
  return `#${((r << 16) | (g << 8) | blue).toString(16).padStart(6, "0")}`;
}

export function getZoneLighting(x: number): ZoneLighting {
  const onRamp = x < WORLD.RAMP_START;
  const from = onRamp ? SURFACE_LIGHT : OUTDOOR_LIGHT;
  const to = onRamp ? GARAGE_LIGHT : SURFACE_LIGHT;
  const t = onRamp
    ? smoothstep((WORLD.RAMP_START - x) / (WORLD.RAMP_START - WORLD.RAMP_END))
    : smoothstep((WORLD.OUTDOOR_END - x) / 12);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    ambient: lerp(from.ambient, to.ambient),
    hemisphere: lerp(from.hemisphere, to.hemisphere),
    sun: lerp(from.sun, to.sun),
    environment: lerp(from.environment, to.environment),
    background: blendColor(from.background, to.background, t),
    fog: blendColor(from.fog, to.fog, t),
    fogNear: lerp(from.fogNear, to.fogNear),
    fogFar: lerp(from.fogFar, to.fogFar),
    brightness: lerp(from.brightness, to.brightness),
  };
}

// Mutates one persistent state: no per-frame vectors, arrays, or object allocations.
// The car's forward axis is local -X. Positive heading turns toward world +Z.
export function stepDrivingState(
  state: DrivingState,
  input: DriveInput,
  delta: number,
  enabled = true,
): void {
  if (!enabled) {
    state.speed = 0;
    state.steering = 0;
    return;
  }
  if (!Number.isFinite(delta) || delta <= 0) return;

  const elapsed = Math.min(delta, 0.15);
  const substeps = Math.ceil(elapsed * 60);
  const dt = elapsed / substeps;
  const throttle = Number(input.forward) - Number(input.reverse);
  const steerTarget = (Number(input.left) - Number(input.right)) * 0.48;

  for (let i = 0; i < substeps; i += 1) {
    const oldSpeed = state.speed;
    const oldSteering = state.steering;
    state.steering += (steerTarget - state.steering) * (1 - Math.exp(-7 * dt));

    if (throttle !== 0) {
      const target = throttle > 0 ? WORLD.MAX_FORWARD_SPEED : -WORLD.MAX_REVERSE_SPEED;
      const acceleration = oldSpeed * throttle < 0 ? 6.5 : 3.8;
      state.speed += clamp(target - state.speed, -acceleration * dt, acceleration * dt);
    } else {
      state.speed *= Math.exp(-2.8 * dt);
      if (Math.abs(state.speed) < 0.025) state.speed = 0;
    }

    const speed = (oldSpeed + state.speed) * 0.5;
    const steering = (oldSteering + state.steering) * 0.5;
    const yawDelta = (speed * Math.tan(steering) * dt) / WORLD.WHEELBASE;
    const midHeading = state.heading + yawDelta * 0.5;
    let nextX = state.x - Math.cos(midHeading) * speed * dt;
    let nextZ = state.z + Math.sin(midHeading) * speed * dt;
    let blocked = false;

    if (nextX < WORLD.MIN_X || nextX > WORLD.MAX_X) {
      nextX = clamp(nextX, WORLD.MIN_X, WORLD.MAX_X);
      blocked = true;
    }

    // Enter the ramp only through its mouth. Driving beside it meets a barrier;
    // it never teleports the car laterally or drops it into another floor.
    if (state.x >= WORLD.RAMP_START && nextX < WORLD.RAMP_START
      && Math.abs(nextZ) > WORLD.DRIVE_RAMP_HALF_WIDTH) {
      nextX = WORLD.RAMP_START;
      blocked = true;
    }
    if (state.x <= WORLD.RAMP_END && nextX > WORLD.RAMP_END
      && Math.abs(nextZ) > WORLD.DRIVE_RAMP_HALF_WIDTH) {
      nextX = WORLD.RAMP_END;
      blocked = true;
    }

    const zone = getDrivingZone(nextX);
    const halfWidth = zone === "ramp"
      ? WORLD.DRIVE_RAMP_HALF_WIDTH
      : zone === "outdoor"
        ? WORLD.OUTDOOR_HALF_WIDTH
        : WORLD.GARAGE_HALF_WIDTH;
    if (Math.abs(nextZ) > halfWidth) {
      nextZ = clamp(nextZ, -halfWidth, halfWidth);
      blocked = true;
    }

    const movedX = nextX - state.x;
    const movedZ = nextZ - state.z;
    const movedDistance = Math.hypot(movedX, movedZ);
    state.distance += (speed < 0 ? -1 : 1) * movedDistance;
    state.x = nextX;
    state.z = nextZ;
    if (movedDistance > 0.00001) state.heading += yawDelta;
    if (blocked) state.speed = 0;
  }

  state.y = getRoadHeight(state.x);
  // Match the slope under the car's actual heading (also works in reverse).
  state.pitch = Math.atan(Math.tan(getRoadPitch(state.x)) * Math.cos(state.heading));
}
