export type FilmId = "royal101" | "royal701" | "royal901" | "royal801";
export type TintZone = "front" | "frontSide" | "rearSide" | "rear";
export type TintSettings = Record<TintZone, number>;

export type FilmPreset = {
  name: string;
  type: string;
  availableVlts: readonly number[];
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  envMapIntensity: number;
  reflectivity: number;
  transmission: number;
  interiorTint: string;
};

// These are visual material presets, not measured film or optical specifications.
export const FILMS: Record<FilmId, FilmPreset> = {
  royal101: {
    name: "Royal 101",
    type: "비반사 블랙",
    availableVlts: [5, 15, 35, 50],
    color: "#202423",
    metalness: 0.04,
    roughness: 0.22,
    clearcoat: 0.3,
    envMapIntensity: 0.65,
    reflectivity: 0.18,
    transmission: 0.08,
    interiorTint: "#f1f2ef",
  },
  royal701: {
    name: "Royal 701",
    type: "반사 · Peridot Green",
    availableVlts: [10, 30],
    color: "#528c78",
    metalness: 0.34,
    roughness: 0.1,
    clearcoat: 1,
    envMapIntensity: 1.7,
    reflectivity: 0.8,
    transmission: 0.06,
    interiorTint: "#dcece4",
  },
  royal901: {
    name: "Royal 901",
    type: "Hyper Black",
    availableVlts: [10, 30],
    color: "#101b25",
    metalness: 0.025,
    roughness: 0.26,
    clearcoat: 0.2,
    envMapIntensity: 0.5,
    reflectivity: 0.12,
    transmission: 0.05,
    interiorTint: "#e6eaee",
  },
  royal801: {
    name: "Royal 801",
    type: "Blue 계열",
    availableVlts: [10, 25],
    color: "#365b80",
    metalness: 0.18,
    roughness: 0.16,
    clearcoat: 0.7,
    envMapIntensity: 1.1,
    reflectivity: 0.52,
    transmission: 0.06,
    interiorTint: "#dfe7f0",
  },
};

export const DEFAULT_FILM_ID: FilmId = "royal101";
export const DEFAULT_TINTS: TintSettings = Object.freeze({
  front: 35,
  frontSide: 15,
  rearSide: 15,
  rear: 15,
});

export const TINT_ZONES: readonly {
  id: TintZone;
  label: string;
  englishLabel: string;
}[] = [
  { id: "front", label: "전면", englishLabel: "FRONT WINDSHIELD" },
  { id: "frontSide", label: "측면 1열", englishLabel: "FRONT SIDE GLASS" },
  { id: "rearSide", label: "측면 2열", englishLabel: "REAR SIDE GLASS" },
  { id: "rear", label: "후면", englishLabel: "REAR WINDSHIELD" },
];

export function getClosestVlt(current: number, availableVlts: readonly number[]): number {
  if (!Number.isFinite(current) || availableVlts.length === 0 || availableVlts.some((vlt) => !Number.isFinite(vlt))) {
    throw new RangeError("VLT selection requires a finite current value and at least one finite available value.");
  }

  return availableVlts.reduce((closest, candidate) => {
    const distance = Math.abs(candidate - current);
    const closestDistance = Math.abs(closest - current);
    return distance < closestDistance || (distance === closestDistance && candidate > closest)
      ? candidate
      : closest;
  });
}

export function reconcileTintSettings(tints: TintSettings, filmId: FilmId): TintSettings {
  const availableVlts = FILMS[filmId].availableVlts;
  return {
    front: getClosestVlt(tints.front, availableVlts),
    frontSide: getClosestVlt(tints.frontSide, availableVlts),
    rearSide: getClosestVlt(tints.rearSide, availableVlts),
    rear: getClosestVlt(tints.rear, availableVlts),
  };
}

export function getInteriorLightTransmission(vlt: number): number {
  if (!Number.isFinite(vlt)) throw new RangeError("Interior light transmission requires a finite VLT value.");
  const clampedVlt = Math.max(0, Math.min(100, vlt));
  // Perceptual preview brightness, not a measured optical simulation.
  return 0.16 + 0.84 * Math.sqrt(clampedVlt / 100);
}

export type GlassAppearance = {
  color: string;
  opacity: number;
  metalness: number;
  roughness: number;
  clearcoat: number;
  envMapIntensity: number;
  reflectivity: number;
  transmission: number;
};

export function getGlassAppearance(vlt: number, filmId: FilmId, interior = false): GlassAppearance {
  if (!Number.isFinite(vlt)) throw new RangeError("Glass appearance requires a finite VLT value.");

  const film = FILMS[filmId];
  const transmissionRatio = Math.max(0, Math.min(100, vlt)) / 100;
  // A curved alpha response retains cabin detail at 5% while showing clear VLT steps.
  const opacity = 0.13 + 0.8 * Math.pow(1 - transmissionRatio, 1.25);

  return {
    color: interior ? film.interiorTint : film.color,
    opacity: interior ? opacity * 0.72 : opacity,
    metalness: interior ? film.metalness * 0.15 : film.metalness,
    roughness: interior ? Math.max(0.34, film.roughness + 0.16) : film.roughness,
    clearcoat: interior ? film.clearcoat * 0.15 : film.clearcoat,
    envMapIntensity: interior ? film.envMapIntensity * 0.22 : film.envMapIntensity,
    reflectivity: interior ? film.reflectivity * 0.2 : film.reflectivity,
    transmission: interior ? 0 : film.transmission,
  };
}
