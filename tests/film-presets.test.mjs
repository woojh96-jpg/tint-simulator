import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FILM_ID,
  DEFAULT_TINTS,
  FILMS,
  TINT_ZONES,
  getClosestVlt,
  getGlassAppearance,
  getInteriorLightTransmission,
  reconcileTintSettings,
} from "../app/film-presets.ts";

test("each film exposes its own supported VLT values", () => {
  assert.deepEqual(FILMS.royal101.availableVlts, [5, 15, 35, 50]);
  assert.deepEqual(FILMS.royal701.availableVlts, [10, 30]);
  assert.deepEqual(FILMS.royal901.availableVlts, [10, 30]);
  assert.deepEqual(FILMS.royal801.availableVlts, [10, 25]);
  assert.equal(DEFAULT_FILM_ID, "royal101");
  assert.deepEqual(reconcileTintSettings(DEFAULT_TINTS, DEFAULT_FILM_ID), DEFAULT_TINTS);
});

test("closest VLT handles product transitions and preserves supported choices", () => {
  assert.equal(getClosestVlt(35, FILMS.royal701.availableVlts), 30);
  assert.equal(getClosestVlt(15, FILMS.royal701.availableVlts), 10);
  assert.equal(getClosestVlt(30, FILMS.royal101.availableVlts), 35);
  assert.equal(getClosestVlt(30, FILMS.royal801.availableVlts), 25);
  for (const film of Object.values(FILMS)) {
    for (const vlt of film.availableVlts) assert.equal(getClosestVlt(vlt, film.availableVlts), vlt);
  }
});

test("midpoint ties prefer the brighter VLT regardless of option order", () => {
  assert.equal(getClosestVlt(20, [10, 30]), 30);
  assert.equal(getClosestVlt(20, [30, 10]), 30);
  assert.equal(getClosestVlt(17.5, [10, 25]), 25);
  assert.equal(getClosestVlt(25, [5, 15, 35, 50]), 35);
});

test("empty options and non-finite selections reject explicitly", () => {
  assert.throws(() => getClosestVlt(15, []), RangeError);
  assert.throws(() => getClosestVlt(Number.NaN, [10, 30]), RangeError);
  assert.throws(() => getClosestVlt(15, [10, Number.POSITIVE_INFINITY]), RangeError);
});

test("changing film reconciles every zone independently without mutating previous choices", () => {
  const original = Object.freeze({ front: 35, frontSide: 15, rearSide: 50, rear: 5 });
  const green = reconcileTintSettings(original, "royal701");
  assert.deepEqual(green, { front: 30, frontSide: 10, rearSide: 30, rear: 10 });
  assert.deepEqual(original, { front: 35, frontSide: 15, rearSide: 50, rear: 5 });

  const blue = reconcileTintSettings(green, "royal801");
  assert.deepEqual(blue, { front: 25, frontSide: 10, rearSide: 25, rear: 10 });
  assert.deepEqual(reconcileTintSettings(blue, "royal101"), { front: 35, frontSide: 15, rearSide: 35, rear: 15 });
  assert.deepEqual(TINT_ZONES.map(({ id }) => id), ["front", "frontSide", "rearSide", "rear"]);
});

test("glass remains translucent at 5% and gets consistently clearer at higher VLT", () => {
  for (const filmId of Object.keys(FILMS)) {
    const darkest = getGlassAppearance(5, filmId);
    assert.ok(darkest.opacity > 0 && darkest.opacity < 1);
    let previousOpacity = darkest.opacity;
    for (const vlt of [10, 15, 25, 30, 35, 50, 70]) {
      const appearance = getGlassAppearance(vlt, filmId);
      assert.ok(appearance.opacity > 0 && appearance.opacity < previousOpacity);
      previousOpacity = appearance.opacity;
    }
    // The midpoint is deliberately not a simple linear alpha interpolation.
    const low = getGlassAppearance(5, filmId).opacity;
    const high = getGlassAppearance(35, filmId).opacity;
    assert.ok(Math.abs(getGlassAppearance(20, filmId).opacity - (low + high) / 2) > 0.001);
  }
});

test("reflective film distinctions and muted interior appearances are retained", () => {
  const black = getGlassAppearance(30, "royal101");
  const green = getGlassAppearance(30, "royal701");
  const blue = getGlassAppearance(25, "royal801");
  const hyperBlack = getGlassAppearance(30, "royal901");
  assert.ok(green.envMapIntensity > blue.envMapIntensity && blue.envMapIntensity > black.envMapIntensity);
  assert.ok(green.reflectivity > blue.reflectivity && blue.reflectivity > black.reflectivity);
  assert.notEqual(black.color, hyperBlack.color);
  for (const filmId of Object.keys(FILMS)) {
    const exterior = getGlassAppearance(15, filmId);
    const interior = getGlassAppearance(15, filmId, true);
    assert.ok(interior.envMapIntensity < exterior.envMapIntensity);
    assert.ok(interior.reflectivity < exterior.reflectivity);
    assert.ok(interior.opacity < exterior.opacity);
    assert.equal(interior.color, FILMS[filmId].interiorTint);
  }
});

test("interior brightness retains detail at 5% and increases toward full light", () => {
  let previous = -1;
  for (const vlt of [0, 5, 15, 35, 50, 100]) {
    const brightness = getInteriorLightTransmission(vlt);
    assert.ok(brightness > previous && brightness <= 1);
    previous = brightness;
  }
  assert.ok(getInteriorLightTransmission(5) > 0);
  assert.ok(getInteriorLightTransmission(5) < getInteriorLightTransmission(50) * 0.6);
  assert.equal(getInteriorLightTransmission(-10), getInteriorLightTransmission(0));
  assert.equal(getInteriorLightTransmission(120), getInteriorLightTransmission(100));
  for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(() => getInteriorLightTransmission(invalid), RangeError);
  }
});
