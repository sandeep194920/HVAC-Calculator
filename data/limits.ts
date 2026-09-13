import type { SourceType, VerificationStatus } from "@/lib/types";

/**
 * Design limits as DATA, not constants (CLAUDE.md principle 3).
 *
 * No engine code may write `if (multiplier > 2)`. Every threshold lives here with
 * the reference it came from and its classification, so a value can be corrected
 * — or an edition updated — without touching the calculation engine.
 *
 * Phase 1 evaluates equivalent length only, so these are the equivalent-length
 * limits. Velocity and pressure-drop limits belong in this same file when the
 * pressure-drop engine lands; they are deliberately not stubbed here.
 */

export type LineType = "suction" | "liquid" | "discharge";

export const LINE_TYPES: readonly { id: LineType; label: string }[] = [
  { id: "suction", label: "Suction Line (Vapour)" },
  { id: "liquid", label: "Liquid Line" },
  { id: "discharge", label: "Discharge Line (Hot Gas)" },
] as const;

/**
 * A banded limit. Values at or below `warnAbove` pass; above `failAbove` fail;
 * between them is the engineering-review band.
 *
 * `warnAbove` / `failAbove` are `null` where the parameter has no upper bound in
 * that direction — absent, not infinite, so the engine can say "no limit defined"
 * rather than silently passing everything.
 */
export type UpperBandLimit = {
  id: string;
  parameter: string;
  unit: string;
  warnAbove: number | null;
  failAbove: number | null;
  sourceId: string;
  sourceType: SourceType;
  edition: string;
  verificationStatus: VerificationStatus;
  /** Shown alongside the verdict so the engineer knows what the band represents. */
  rationale: string;
};

/**
 * Equivalent-length multiplier bands.
 *
 * These are design-practice heuristics for reviewing a piping configuration, NOT
 * a standard requirement — a multiplier of 2.5 is not a violation of anything, it
 * is a prompt to check the run. Classified `recommendation` accordingly, and the
 * UI must not render it as a limit the design fails.
 */
export const EQUIVALENT_LENGTH_MULTIPLIER_LIMIT: UpperBandLimit = {
  id: "eq-length-multiplier",
  parameter: "Equivalent Length Multiplier",
  unit: "x",
  warnAbove: 2.0,
  failAbove: 3.0,
  sourceId: "engineering-practice",
  sourceType: "recommendation",
  edition: "n/a",
  verificationStatus: "unverified",
  rationale:
    "A typical refrigeration run behaves as 1.2–2.0x its measured length. Above 2.0x, fittings and valves dominate and the configuration is worth reviewing before accepting a larger line size. Above 3.0x, a single high-loss component (usually a globe or solenoid valve) is normally responsible. This is review guidance, not a pass/fail requirement of any standard.",
};

/**
 * Total equivalent length bands.
 *
 * Deliberately generous: the real constraint is pressure drop, which depends on
 * refrigerant, line type, capacity and size — none of which Phase 1 computes. A
 * long run is not wrong, it just needs its pressure drop checked, and that is
 * what the warning says.
 */
export const TOTAL_EQUIVALENT_LENGTH_LIMIT: UpperBandLimit = {
  id: "total-eq-length",
  parameter: "Total Equivalent Length",
  unit: "ft",
  warnAbove: 200,
  failAbove: null,
  sourceId: "engineering-practice",
  sourceType: "recommendation",
  edition: "n/a",
  verificationStatus: "unverified",
  rationale:
    "Runs beyond roughly 200 ft equivalent commonly need a line-size increase to hold the saturation-temperature penalty within design allowance. There is no upper limit at which a run is invalid — the governing check is pressure drop against available saturation-temperature drop, which requires refrigerant properties and is outside Phase 1 scope.",
};

export const LIMITS: readonly UpperBandLimit[] = [
  EQUIVALENT_LENGTH_MULTIPLIER_LIMIT,
  TOTAL_EQUIVALENT_LENGTH_LIMIT,
] as const;
