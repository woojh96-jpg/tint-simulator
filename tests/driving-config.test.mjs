import assert from "node:assert/strict";
import test from "node:test";
import {
  WORLD, createDrivingState, getDrivingZone, getRoadHeight, getRoadPitch,
  getZoneLighting, stepDrivingState,
} from "../lib/driving-config.ts";

const input = (values = {}) => ({ forward: false, reverse: false, left: false, right: false, ...values });
function drive(state, controls, seconds, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i += 1) stepDrivingState(state, controls, 1 / fps);
  return state;
}

test("driving follows -X and remains close across 30, 60 and 120 fps", () => {
  const states = [30, 60, 120].map((fps) => drive(createDrivingState(), input({ forward: true, left: true }), 2.5, fps));
  for (const state of states) {
    assert.ok(state.x < WORLD.INITIAL_X);
    assert.ok(state.z > 0);
    assert.ok(state.heading > 0);
    assert.ok(state.speed <= WORLD.MAX_FORWARD_SPEED);
    assert.ok(Math.abs(state.x - states[0].x) < 0.025);
    assert.ok(Math.abs(state.z - states[0].z) < 0.025);
    assert.ok(Math.abs(state.heading - states[0].heading) < 0.01);
  }
});

test("reversing naturally reverses yaw for the same steering input", () => {
  const reverse = drive(createDrivingState(), input({ reverse: true, left: true }), 1);
  assert.ok(reverse.speed < 0);
  assert.ok(reverse.heading < 0);
  assert.ok(reverse.x > WORLD.INITIAL_X);
  assert.ok(reverse.distance < 0);
  assert.ok(Math.abs(reverse.speed) <= WORLD.MAX_REVERSE_SPEED);
});

test("steering is smoothed, releases center, and does not rotate a stationary car", () => {
  const state = createDrivingState();
  stepDrivingState(state, input({ left: true }), 1 / 60);
  assert.ok(state.steering > 0 && state.steering < 0.1);
  assert.equal(state.heading, 0);
  drive(state, input(), 2);
  assert.ok(state.steering < 0.000001);
});

test("releasing throttle coasts to a complete stop; disabled driving stays still", () => {
  const state = drive(createDrivingState(), input({ forward: true }), 1);
  const releaseX = state.x;
  drive(state, input(), 3);
  assert.equal(state.speed, 0);
  assert.ok(state.x < releaseX);
  const x = state.x;
  stepDrivingState(state, input({ forward: true }), 1, false);
  assert.equal(state.x, x);
  assert.equal(state.speed, 0);
});

test("one connected center route reaches all zones and follows ramp elevation", () => {
  const state = createDrivingState();
  const seen = new Set([getDrivingZone(state.x)]);
  for (let i = 0; i < 1500; i += 1) {
    stepDrivingState(state, input({ forward: true }), 1 / 60);
    seen.add(getDrivingZone(state.x));
    assert.equal(state.y, getRoadHeight(state.x));
  }
  assert.deepEqual([...seen], ["outdoor", "surfaceParking", "ramp", "underground"]);
  assert.equal(state.y, WORLD.GARAGE_Y);
});

test("ramp elevation and pitch meet flat floors smoothly", () => {
  assert.equal(getRoadHeight(WORLD.RAMP_START), 0);
  assert.equal(getRoadHeight(WORLD.RAMP_END), WORLD.GARAGE_Y);
  assert.equal(getRoadPitch(WORLD.RAMP_START), 0);
  assert.equal(getRoadPitch(WORLD.RAMP_END), 0);
  const midpoint = (WORLD.RAMP_START + WORLD.RAMP_END) / 2;
  assert.equal(getRoadHeight(midpoint), WORLD.GARAGE_Y / 2);
  assert.ok(getRoadPitch(midpoint) > 0 && getRoadPitch(midpoint) < 0.25);
  for (let x = WORLD.RAMP_END; x < WORLD.RAMP_START; x += 0.5) {
    assert.ok(getRoadHeight(x) <= getRoadHeight(x + 0.5));
    const derivative = (getRoadHeight(x + 0.001) - getRoadHeight(x - 0.001)) / 0.002;
    assert.ok(Math.abs(Math.tan(getRoadPitch(x)) - derivative) < 0.0001);
  }
});

test("map boundaries stop infinite travel and protect the ramp's side portals", () => {
  const state = drive(createDrivingState(), input({ forward: true }), 40);
  assert.equal(state.x, WORLD.MIN_X);
  assert.equal(state.speed, 0);

  const besideEntrance = { ...createDrivingState(), x: WORLD.RAMP_START + 0.1, z: 8 };
  drive(besideEntrance, input({ forward: true }), 2);
  assert.equal(besideEntrance.x, WORLD.RAMP_START);
  assert.equal(besideEntrance.z, 8);
  assert.equal(besideEntrance.y, 0);

  const besideExit = { ...createDrivingState(), x: WORLD.RAMP_END - 0.1, z: -8 };
  drive(besideExit, input({ reverse: true }), 2);
  assert.equal(besideExit.x, WORLD.RAMP_END);
  assert.equal(besideExit.z, -8);
  assert.equal(besideExit.y, WORLD.GARAGE_Y);

  const rampWall = { ...createDrivingState(), x: -54, z: 3, heading: Math.PI / 2 };
  drive(rampWall, input({ forward: true }), 2);
  assert.equal(rampWall.z, WORLD.DRIVE_RAMP_HALF_WIDTH);
});

test("lighting transitions continuously and darkens toward the garage", () => {
  let previous = getZoneLighting(20);
  for (let x = 19.9; x >= -100; x -= 0.1) {
    const current = getZoneLighting(x);
    for (const key of ["ambient", "hemisphere", "sun", "environment", "brightness"]) {
      assert.ok(current[key] <= previous[key] + 0.000001, key);
      assert.ok(Math.abs(current[key] - previous[key]) < 0.04, key);
    }
    assert.match(current.background, /^#[0-9a-f]{6}$/);
    previous = current;
  }
  assert.ok(getZoneLighting(-100).brightness < getZoneLighting(20).brightness / 3);
  for (const threshold of [WORLD.OUTDOOR_END, WORLD.RAMP_START, WORLD.RAMP_END]) {
    assert.ok(Math.abs(getZoneLighting(threshold - 0.001).brightness - getZoneLighting(threshold + 0.001).brightness) < 0.0001);
  }
});

test("large or invalid frame deltas cannot teleport the vehicle", () => {
  const state = createDrivingState();
  for (const delta of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    stepDrivingState(state, input({ forward: true }), delta);
    assert.equal(state.x, WORLD.INITIAL_X);
  }
  stepDrivingState(state, input({ forward: true }), 30);
  assert.ok(WORLD.INITIAL_X - state.x < 0.1);
});
