/**
 * Unit handling.
 *
 * Rule: one canonical unit per dimension, stored internally; convert only at the
 * boundary (user input in, display out). The source spreadsheet's headline bug is
 * exactly what happens when feet and inches are added together in the middle of a
 * calculation, so the engine never sees a unit-ambiguous number.
 *
 * Canonical units: length = ft, diameter = in, pressure = psi, temperature = °F.
 */

export type LengthUnit = "ft" | "in" | "m" | "mm";
export type DiameterUnit = "in" | "mm";
export type PressureUnit = "psi" | "bar" | "kPa" | "MPa";
export type TemperatureUnit = "F" | "C" | "K";
export type CapacityUnit = "ton" | "kW" | "btuh" | "MBH";
export type MassFlowUnit = "lb/h" | "lb/min" | "kg/h" | "kg/s";
export type VelocityUnit = "ft/min" | "ft/s" | "m/s";

/** Canonical unit for each dimension the engine works in. */
export const CANONICAL = {
  length: "ft",
  diameter: "in",
  pressure: "psi",
  temperature: "F",
} as const;

type UnitMeta = { label: string; /** multiply canonical by this to get the unit */ perCanonical: number };

const LENGTH: Record<LengthUnit, UnitMeta> = {
  ft: { label: "ft", perCanonical: 1 },
  in: { label: "in", perCanonical: 12 },
  m: { label: "m", perCanonical: 0.3048 },
  mm: { label: "mm", perCanonical: 304.8 },
};

const DIAMETER: Record<DiameterUnit, UnitMeta> = {
  in: { label: "in", perCanonical: 1 },
  mm: { label: "mm", perCanonical: 25.4 },
};

const PRESSURE: Record<PressureUnit, UnitMeta> = {
  psi: { label: "psi", perCanonical: 1 },
  bar: { label: "bar", perCanonical: 0.0689476 },
  kPa: { label: "kPa", perCanonical: 6.89476 },
  MPa: { label: "MPa", perCanonical: 0.00689476 },
};

const CAPACITY: Record<CapacityUnit, UnitMeta> = {
  // canonical: ton of refrigeration
  ton: { label: "ton", perCanonical: 1 },
  kW: { label: "kW", perCanonical: 3.516853 },
  btuh: { label: "Btu/h", perCanonical: 12000 },
  MBH: { label: "MBH", perCanonical: 12 },
};

const MASS_FLOW: Record<MassFlowUnit, UnitMeta> = {
  // canonical: lb/h
  "lb/h": { label: "lb/h", perCanonical: 1 },
  "lb/min": { label: "lb/min", perCanonical: 1 / 60 },
  "kg/h": { label: "kg/h", perCanonical: 0.45359237 },
  "kg/s": { label: "kg/s", perCanonical: 0.45359237 / 3600 },
};

const VELOCITY: Record<VelocityUnit, UnitMeta> = {
  // canonical: ft/min
  "ft/min": { label: "ft/min", perCanonical: 1 },
  "ft/s": { label: "ft/s", perCanonical: 1 / 60 },
  "m/s": { label: "m/s", perCanonical: 0.3048 / 60 },
};

function toCanonicalFactor<U extends string>(table: Record<U, UnitMeta>, unit: U): number {
  return table[unit].perCanonical;
}

/* ---------- Length (canonical: ft) ---------- */

export function lengthToFt(value: number, from: LengthUnit): number {
  return value / toCanonicalFactor(LENGTH, from);
}

export function lengthFromFt(valueFt: number, to: LengthUnit): number {
  return valueFt * toCanonicalFactor(LENGTH, to);
}

export const LENGTH_UNITS = Object.keys(LENGTH) as LengthUnit[];

/* ---------- Diameter (canonical: in) ---------- */

export function diameterToIn(value: number, from: DiameterUnit): number {
  return value / toCanonicalFactor(DIAMETER, from);
}

export function diameterFromIn(valueIn: number, to: DiameterUnit): number {
  return valueIn * toCanonicalFactor(DIAMETER, to);
}

export const DIAMETER_UNITS = Object.keys(DIAMETER) as DiameterUnit[];

/* ---------- Pressure (canonical: psi) ---------- */

export function pressureToPsi(value: number, from: PressureUnit): number {
  return value / toCanonicalFactor(PRESSURE, from);
}

export function pressureFromPsi(valuePsi: number, to: PressureUnit): number {
  return valuePsi * toCanonicalFactor(PRESSURE, to);
}

export const PRESSURE_UNITS = Object.keys(PRESSURE) as PressureUnit[];

/* ---------- Temperature (canonical: °F) — affine, so not a factor table ---------- */

export function temperatureToF(value: number, from: TemperatureUnit): number {
  switch (from) {
    case "F":
      return value;
    case "C":
      return value * 9 / 5 + 32;
    case "K":
      return (value - 273.15) * 9 / 5 + 32;
  }
}

export function temperatureFromF(valueF: number, to: TemperatureUnit): number {
  switch (to) {
    case "F":
      return valueF;
    case "C":
      return (valueF - 32) * 5 / 9;
    case "K":
      return (valueF - 32) * 5 / 9 + 273.15;
  }
}

/**
 * A temperature *difference*, which converts by ratio, not by the affine
 * transform above. A 2°F design limit on saturation drop is 1.11°C, not -16.7°C.
 */
export function temperatureDeltaFromF(deltaF: number, to: TemperatureUnit): number {
  return to === "F" ? deltaF : deltaF * 5 / 9;
}

export const TEMPERATURE_UNITS: TemperatureUnit[] = ["F", "C", "K"];

/* ---------- Capacity (canonical: ton) ---------- */

export function capacityToTon(value: number, from: CapacityUnit): number {
  return value / toCanonicalFactor(CAPACITY, from);
}

export function capacityFromTon(valueTon: number, to: CapacityUnit): number {
  return valueTon * toCanonicalFactor(CAPACITY, to);
}

export const CAPACITY_UNITS = Object.keys(CAPACITY) as CapacityUnit[];

/* ---------- Mass flow (canonical: lb/h) ---------- */

export function massFlowToLbH(value: number, from: MassFlowUnit): number {
  return value / toCanonicalFactor(MASS_FLOW, from);
}

export function massFlowFromLbH(valueLbH: number, to: MassFlowUnit): number {
  return valueLbH * toCanonicalFactor(MASS_FLOW, to);
}

export const MASS_FLOW_UNITS = Object.keys(MASS_FLOW) as MassFlowUnit[];

/* ---------- Velocity (canonical: ft/min) ---------- */

export function velocityToFpm(value: number, from: VelocityUnit): number {
  return value / toCanonicalFactor(VELOCITY, from);
}

export function velocityFromFpm(valueFpm: number, to: VelocityUnit): number {
  return valueFpm * toCanonicalFactor(VELOCITY, to);
}

export const VELOCITY_UNITS = Object.keys(VELOCITY) as VelocityUnit[];

/* ---------- Display helpers ---------- */

export function unitLabel(unit: string): string {
  const all: Record<string, UnitMeta> = { ...LENGTH, ...PRESSURE, ...CAPACITY, ...MASS_FLOW, ...VELOCITY };
  if (unit in all) return all[unit].label;
  if (unit === "F") return "°F";
  if (unit === "C") return "°C";
  if (unit === "K") return "K";
  return unit;
}

/**
 * Round for display without pretending to precision the input never had.
 * Equivalent-length data is given to one decimal, so totals are shown the same way.
 */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function formatLength(valueFt: number, unit: LengthUnit, decimals = 1): string {
  return `${round(lengthFromFt(valueFt, unit), decimals).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${unitLabel(unit)}`;
}
