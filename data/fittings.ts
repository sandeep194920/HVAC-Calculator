import type { SourceType, VerificationStatus } from "@/lib/types";

/**
 * Fitting, valve and refrigeration-device equivalent lengths.
 *
 * Transcribed from the "Source Data" sheet of
 * `sources/line-sizing/equivalent-length-calculations.xlsx`.
 *
 * TWO THINGS THAT MATTER:
 *
 * 1. All values are in FEET, as given on the Source Data sheet. The workbook's
 *    other sheet ("Equivalent Length") multiplies these by 12 and then converts
 *    the sum from inches, producing totals roughly 12x too small. That behaviour
 *    is deliberately not reproduced here. See `lib/known-issues.ts`.
 *
 * 2. A dash on the source sheet means the value is ABSENT — not zero. Absent is
 *    modelled as `null` and the engine refuses to calculate rather than quietly
 *    contributing 0 ft. A silent zero is indistinguishable on screen from a
 *    fitting that genuinely adds no length, and that is how a run gets undersized.
 *
 * Every row is `unverified`: these came from a working spreadsheet that does not
 * record which published table each figure derives from. Sanjeev verifies against
 * licensed copies before any of this ships as authoritative.
 */

/** Nominal copper tube size (OD), as written on the source sheet. */
export type NominalSize =
  | "1/2"
  | "5/8"
  | "3/4"
  | "7/8"
  | "1-1/8"
  | "1-3/8"
  | "1-5/8"
  | "2-1/8"
  | "2-5/8"
  | "3-1/8"
  | "3-5/8"
  | "4-1/8"
  | "5-1/8"
  | "6-1/8"
  | "8-1/8";

/** Ordered smallest to largest — this order drives the size selector. */
export const NOMINAL_SIZES: readonly NominalSize[] = [
  "1/2",
  "5/8",
  "3/4",
  "7/8",
  "1-1/8",
  "1-3/8",
  "1-5/8",
  "2-1/8",
  "2-5/8",
  "3-1/8",
  "3-5/8",
  "4-1/8",
  "5-1/8",
  "6-1/8",
  "8-1/8",
] as const;

export type FittingCategory =
  | "elbow"
  | "tee"
  | "coupling"
  | "valve"
  | "device";

export type FittingId =
  | "elbow-90-std"
  | "elbow-90-long-radius"
  | "elbow-90-street"
  | "elbow-45-std"
  | "elbow-45-street"
  | "elbow-180-std"
  | "tee-branch-flow"
  | "tee-straight-no-reduction"
  | "tee-straight-25-reduction"
  | "tee-straight-50-reduction"
  | "coupling-enlarging-1-4"
  | "coupling-enlarging-1-2"
  | "coupling-enlarging-3-4"
  | "coupling-reducing-1-4"
  | "coupling-reducing-1-2"
  | "coupling-reducing-3-4"
  | "valve-ball"
  | "valve-globe-solenoid"
  | "valve-angle"
  | "valve-gate"
  | "valve-swing-check"
  | "device-sight-glass"
  | "device-filter-drier"
  | "device-suction-filter";

/**
 * `null` = the source sheet has no value for this size (shown as "—").
 * Never coerce to 0.
 */
export type EquivalentLengthFt = number | null;

export type FittingDefinition = {
  id: FittingId;
  /** Display name, matching the source sheet's vocabulary. */
  name: string;
  category: FittingCategory;
  /** Column grouping on the source sheet, used for the picker's optgroups. */
  group: string;
  /** Equivalent length in FEET, by nominal size. Missing size = absent, not zero. */
  equivalentLengthFt: Partial<Record<NominalSize, EquivalentLengthFt>>;
  sourceId: string;
  sourceType: SourceType;
  edition: string;
  verificationStatus: VerificationStatus;
  notes?: string;
};

const SOURCE = {
  sourceId: "sanjeev-worksheet",
  sourceType: "recommendation" as SourceType,
  edition: "supplied 2025",
  verificationStatus: "unverified" as VerificationStatus,
};

/**
 * Helper: zips the ordered size list against an ordered value list, so each row
 * below reads in the same left-to-right order as the spreadsheet row it came
 * from and can be diffed against it by eye during verification.
 */
function bySize(
  values: readonly EquivalentLengthFt[],
): Partial<Record<NominalSize, EquivalentLengthFt>> {
  const out: Partial<Record<NominalSize, EquivalentLengthFt>> = {};
  NOMINAL_SIZES.forEach((size, i) => {
    out[size] = i < values.length ? values[i] : null;
  });
  return out;
}

//                    1/2   5/8   3/4   7/8  1-1/8 1-3/8 1-5/8 2-1/8 2-5/8 3-1/8 3-5/8 4-1/8 5-1/8 6-1/8 8-1/8
export const FITTINGS: readonly FittingDefinition[] = [
  {
    id: "elbow-90-std",
    name: "90° Elbow — Standard",
    category: "elbow",
    group: "Elbows",
    equivalentLengthFt: bySize([
      1.4, 1.6, 1.9, 2.3, 2.7, 3.6, 4.2, 5.9, 6.9, 7.7, 9.8, 10, 13, 16, 20,
    ]),
    ...SOURCE,
  },
  {
    id: "elbow-90-long-radius",
    name: "90° Elbow — Long Radius",
    category: "elbow",
    group: "Elbows",
    equivalentLengthFt: bySize([
      0.9, 1.0, 1.3, 1.5, 1.8, 2.4, 2.8, 3.9, 4.6, 5.5, 6.5, 6.7, 8.2, 10, 13,
    ]),
    ...SOURCE,
  },
  {
    id: "elbow-90-street",
    name: "90° Elbow — Street",
    category: "elbow",
    group: "Elbows",
    equivalentLengthFt: bySize([
      2.3, 2.5, null, 3.2, 4.1, 5.6, 6.3, 8.2, 10, 12, 15, 17, 21, 25, null,
    ]),
    ...SOURCE,
  },
  {
    id: "elbow-45-std",
    name: "45° Elbow — Standard",
    category: "elbow",
    group: "Elbows",
    equivalentLengthFt: bySize([
      0.7, 0.8, 0.6, 0.9, 1.3, 1.7, 2.1, 2.6, 3.2, 4.0, 4.7, 5.2, 6.5, 7.9, 10,
    ]),
    ...SOURCE,
    notes:
      "Source sheet gives 3/4\" as 0.6 ft, lower than the 5/8\" value of 0.8 ft. Non-monotonic against neighbouring sizes — flag during verification.",
  },
  {
    id: "elbow-45-street",
    name: "45° Elbow — Street",
    category: "elbow",
    group: "Elbows",
    equivalentLengthFt: bySize([
      1.1, 1.3, null, 1.6, 2.1, 3.0, 3.4, 4.5, 5.2, 6.4, 7.3, 8.5, 11, 13, null,
    ]),
    ...SOURCE,
  },
  {
    id: "elbow-180-std",
    name: "180° Elbow — Standard",
    category: "elbow",
    group: "Elbows",
    equivalentLengthFt: bySize([
      2.3, 2.5, null, 3.2, 4.1, 5.6, 6.3, 8.2, 10, 12, 15, 17, 21, 25, 33,
    ]),
    ...SOURCE,
  },

  {
    id: "tee-branch-flow",
    name: "Tee — Branch Flow",
    category: "tee",
    group: "Tees",
    equivalentLengthFt: bySize([
      2.7, 3.0, 3.0, 4.0, 5.0, 7.0, 8.0, 10, 12, 15, 18, 21, 25, 30, 40,
    ]),
    ...SOURCE,
  },
  {
    id: "tee-straight-no-reduction",
    name: "Tee — Straight Through (no reduction)",
    category: "tee",
    group: "Tees",
    equivalentLengthFt: bySize([
      0.9, 1.0, 1.4, 1.7, 2.3, 2.6, 3.3, 4.1, 5.0, 5.9, 6.7, 8.2, 10, 13, null,
    ]),
    ...SOURCE,
  },
  {
    id: "tee-straight-25-reduction",
    name: "Tee — Straight Through (25% reduction)",
    category: "tee",
    group: "Tees",
    equivalentLengthFt: bySize([
      1.2, 1.4, 1.9, 2.2, 3.1, 3.7, 4.7, 5.6, 7.0, 8.0, 9.0, 12, 14, 18, null,
    ]),
    ...SOURCE,
  },
  {
    id: "tee-straight-50-reduction",
    name: "Tee — Straight Through (50% reduction)",
    category: "tee",
    group: "Tees",
    equivalentLengthFt: bySize([
      1.4, 1.6, 2.0, 2.6, 3.3, 4.0, 5.0, 6.0, 7.5, 9.0, 10, 13, 16, 20, null,
    ]),
    ...SOURCE,
  },

  {
    id: "coupling-enlarging-1-4",
    name: "Enlarging Coupling — 1/4 reduction",
    category: "coupling",
    group: "Couplings",
    equivalentLengthFt: bySize([
      1.4, 1.8, 2.5, 3.2, 4.7, 5.8, 8.0, 10, 13, 15, 17, null, null, null, null,
    ]),
    ...SOURCE,
  },
  {
    id: "coupling-enlarging-1-2",
    name: "Enlarging Coupling — 1/2 reduction",
    category: "coupling",
    group: "Couplings",
    equivalentLengthFt: bySize([
      0.8, 1.1, 1.5, 2.0, 3.0, 3.6, 4.8, 6.1, 8.0, 9.2, 11, null, null, null, null,
    ]),
    ...SOURCE,
  },
  {
    id: "coupling-enlarging-3-4",
    name: "Enlarging Coupling — 3/4 reduction",
    category: "coupling",
    group: "Couplings",
    equivalentLengthFt: bySize([
      0.3, 0.4, 0.5, 0.7, 1.0, 1.2, 1.6, 2.0, 2.6, 3.0, 3.8, null, null, null, null,
    ]),
    ...SOURCE,
  },
  {
    id: "coupling-reducing-1-4",
    name: "Reducing Coupling — 1/4 reduction",
    category: "coupling",
    group: "Couplings",
    equivalentLengthFt: bySize([
      0.7, 0.9, 1.2, 1.6, 2.3, 2.9, 4.0, 5.0, 6.5, 7.7, 9.0, null, null, null, null,
    ]),
    ...SOURCE,
  },
  {
    id: "coupling-reducing-1-2",
    name: "Reducing Coupling — 1/2 reduction",
    category: "coupling",
    group: "Couplings",
    equivalentLengthFt: bySize([
      0.5, 0.7, 1.0, 1.2, 1.8, 2.2, 3.0, 3.8, 4.9, 6.0, 6.8, null, null, null, null,
    ]),
    ...SOURCE,
  },
  {
    id: "coupling-reducing-3-4",
    name: "Reducing Coupling — 3/4 reduction",
    category: "coupling",
    group: "Couplings",
    equivalentLengthFt: bySize([
      0.3, 0.4, 0.5, 0.7, 1.0, 1.2, 1.6, 2.0, 2.6, 3.0, 3.8, null, null, null, null,
    ]),
    ...SOURCE,
  },

  {
    id: "valve-ball",
    name: "Ball Valve",
    category: "valve",
    group: "Valves",
    equivalentLengthFt: bySize([
      1.1, 0.9, 0.9, 0.9, 0.9, 1.0, 1.1, 1.2, 1.8, 2.5, 3.1, 3.8, 4.5, 5.2, 5.9,
    ]),
    ...SOURCE,
  },
  {
    id: "valve-globe-solenoid",
    name: "Globe / Solenoid Valve",
    category: "valve",
    group: "Valves",
    equivalentLengthFt: bySize([
      17, 18, 14, 22, 29, 38, 43, 55, 69, 84, 100, 120, 140, 170, 220,
    ]),
    ...SOURCE,
    notes:
      "Source sheet gives 3/4\" as 14 ft, below both 5/8\" (18 ft) and 7/8\" (22 ft). Non-monotonic — flag during verification.",
  },
  {
    id: "valve-angle",
    name: "Angle Valve",
    category: "valve",
    group: "Valves",
    equivalentLengthFt: bySize([
      6, 7, 7, 9, 12, 15, 18, 24, 29, 35, 41, 47, 58, 70, 85,
    ]),
    ...SOURCE,
  },
  {
    id: "valve-gate",
    name: "Gate Valve",
    category: "valve",
    group: "Valves",
    equivalentLengthFt: bySize([
      0.6, 0.7, null, 0.9, 1.0, 1.5, 1.8, 2.3, 2.8, 3.2, 4.0, 4.5, 6.0, 7.0, 9.0,
    ]),
    ...SOURCE,
  },
  {
    id: "valve-swing-check",
    name: "Swing Check Valve",
    category: "valve",
    group: "Valves",
    equivalentLengthFt: bySize([
      5, 6, 7, 8, 12, 15, 17, 22, 26, 34, 40, 40, 50, 60, 80,
    ]),
    ...SOURCE,
  },

  {
    id: "device-sight-glass",
    name: "Sight Glass",
    category: "device",
    group: "Refrigeration devices",
    equivalentLengthFt: bySize([
      1.0, 1.2, 0.9, 1.6, 2.0, 2.5, 2.6, 3.0, 3.5, 4.5, 5.0, null, null, null, null,
    ]),
    ...SOURCE,
  },
  {
    id: "device-filter-drier",
    name: "Filter-Drier",
    category: "device",
    group: "Refrigeration devices",
    equivalentLengthFt: bySize([
      12, 15, null, 21, 26, 35, null, null, null, null, null, null, null, null, null,
    ]),
    ...SOURCE,
    notes:
      "Source sheet has no values above 1-3/8\" (and none at 3/4\"). Filter-drier pressure drop is strongly model-specific; manufacturer data should be entered directly for larger sizes.",
  },
  {
    id: "device-suction-filter",
    name: "Suction Filter",
    category: "device",
    group: "Refrigeration devices",
    equivalentLengthFt: bySize([
      15, 17, null, 22, 25, 36, 40, null, null, null, null, null, null, null, null,
    ]),
    ...SOURCE,
    notes:
      "Source sheet has no values above 1-5/8\" (and none at 3/4\"). Use manufacturer data for larger sizes.",
  },
] as const;

/**
 * EXV and hot-gas-bypass valves. The source sheet gives these as a RANGE, keyed
 * by the valve's own ODF connection size rather than by line size — a different
 * shape from the table above, so they are modelled separately rather than
 * flattened into a single midpoint that would hide the spread.
 */
export type ValveRangeDefinition = {
  id: "exv" | "hot-gas-bypass";
  name: string;
  /** Keyed by the valve's ODF connection size, not the line nominal size. */
  byConnectionSize: Record<string, { minFt: number; maxFt: number }>;
  sourceId: string;
  sourceType: SourceType;
  edition: string;
  verificationStatus: VerificationStatus;
  notes: string;
};

export const VALVE_RANGES: readonly ValveRangeDefinition[] = [
  {
    id: "exv",
    name: "Electronic Expansion Valve (EXV)",
    byConnectionSize: {
      '1/4" ODF': { minFt: 6, maxFt: 8 },
      '5/16" ODF': { minFt: 7, maxFt: 10 },
      '3/8" ODF': { minFt: 8, maxFt: 12 },
      '1/2" ODF': { minFt: 10, maxFt: 15 },
      '5/8" ODF': { minFt: 12, maxFt: 20 },
      '3/4" ODF': { minFt: 15, maxFt: 22 },
      '7/8" ODF': { minFt: 18, maxFt: 26 },
      '1-1/8" ODF': { minFt: 20, maxFt: 30 },
      '1-3/8" ODF': { minFt: 25, maxFt: 35 },
      '1-5/8" ODF': { minFt: 30, maxFt: 40 },
    },
    ...SOURCE,
    notes:
      "Approximate range, keyed by valve ODF connection size. Actual equivalent length depends on port size and opening position; use manufacturer data where available. The calculator uses the range midpoint and reports the spread.",
  },
  {
    id: "hot-gas-bypass",
    name: "Hot Gas Bypass Valve (HGBV)",
    byConnectionSize: {
      '1/4" ODF': { minFt: 8, maxFt: 15 },
      '5/16" ODF': { minFt: 10, maxFt: 18 },
      '3/8" ODF': { minFt: 12, maxFt: 20 },
      '1/2" ODF': { minFt: 15, maxFt: 25 },
      '5/8" ODF': { minFt: 18, maxFt: 30 },
      '3/4" ODF': { minFt: 20, maxFt: 35 },
      '7/8" ODF': { minFt: 25, maxFt: 40 },
      '1-1/8" ODF': { minFt: 30, maxFt: 50 },
      '1-3/8" ODF': { minFt: 35, maxFt: 55 },
      '1-5/8" ODF': { minFt: 40, maxFt: 65 },
    },
    ...SOURCE,
    notes:
      "Approximate range, keyed by valve ODF connection size. The calculator uses the range midpoint and reports the spread.",
  },
] as const;

export const EXV_CONNECTION_SIZES = Object.keys(
  VALVE_RANGES[0].byConnectionSize,
);

/* ---------- lookups ---------- */

const FITTING_BY_ID = new Map(FITTINGS.map((f) => [f.id, f]));

export function getFitting(id: FittingId): FittingDefinition {
  const f = FITTING_BY_ID.get(id);
  if (!f) throw new Error(`Unknown fitting id: ${id}`);
  return f;
}

export function getValveRange(id: ValveRangeDefinition["id"]): ValveRangeDefinition {
  const v = VALVE_RANGES.find((r) => r.id === id);
  if (!v) throw new Error(`Unknown valve range id: ${id}`);
  return v;
}

/**
 * Returns the equivalent length in feet, or `null` if the source sheet has no
 * value for that size. Callers must handle `null` — see `lib/equivalent-length.ts`,
 * which raises a warning and excludes the row from the total rather than adding 0.
 */
export function lookupEquivalentLengthFt(
  id: FittingId,
  size: NominalSize,
): EquivalentLengthFt {
  const entry = getFitting(id).equivalentLengthFt[size];
  return entry === undefined ? null : entry;
}

/** Sizes for which this fitting actually has data. Drives the size picker. */
export function availableSizes(id: FittingId): NominalSize[] {
  const f = getFitting(id);
  return NOMINAL_SIZES.filter((s) => {
    const v = f.equivalentLengthFt[s];
    return v !== null && v !== undefined;
  });
}

/** Fittings grouped for a <select>, in source-sheet order. */
export function fittingsByGroup(): { group: string; fittings: FittingDefinition[] }[] {
  const groups: { group: string; fittings: FittingDefinition[] }[] = [];
  for (const f of FITTINGS) {
    let g = groups.find((x) => x.group === f.group);
    if (!g) {
      g = { group: f.group, fittings: [] };
      groups.push(g);
    }
    g.fittings.push(f);
  }
  return groups;
}
