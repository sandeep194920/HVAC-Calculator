/**
 * Core engineering types.
 *
 * Two ideas drive everything here:
 *
 * 1. A calculation returns its work, not just its answer. `Calculation<T>` carries
 *    the formula, the numbers that went into it, and the references behind it, so
 *    the UI can render a "Show Calculation" panel without the engine knowing the
 *    UI exists.
 *
 * 2. A data value without provenance is not usable in this domain. `Sourced<T>`
 *    makes it impossible to add a fitting length or a velocity limit without
 *    saying where it came from and whether anyone has verified it.
 */

/**
 * The authority behind a value. These are ordered and are NOT interchangeable:
 * a velocity guideline from ASHRAE is not a code minimum, and rendering one as
 * the other misleads the engineer reading it.
 *
 * code > standard > manufacturer > recommendation
 */
export type SourceType =
  | "code"
  | "standard"
  | "manufacturer"
  | "recommendation"
  | "user-defined";

/** Rank for sorting/comparison. Higher binds harder. */
export const SOURCE_TYPE_RANK: Record<SourceType, number> = {
  code: 4,
  standard: 3,
  manufacturer: 2,
  recommendation: 1,
  "user-defined": 0,
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  code: "Code requirement",
  standard: "Standard requirement",
  manufacturer: "Manufacturer requirement",
  recommendation: "Engineering recommendation",
  "user-defined": "User-defined value",
};

/**
 * Whether a domain expert has checked this value against a licensed copy of the
 * cited source. Everything ported from the source spreadsheet starts as
 * `unverified` — Sanjeev has not yet checked it against ASHRAE/AHRI originals,
 * and shipping unverified standards-derived data as though it were verified is
 * the legal exposure CLAUDE.md warns about.
 */
export type VerificationStatus = "verified" | "unverified" | "disputed";

/** A citation. `edition` is required because a standard without an edition is not a citation. */
export type Reference = {
  /** Short key for deduping references across a calculation. */
  id: string;
  /** e.g. "ASHRAE Handbook — Refrigeration" */
  title: string;
  /** e.g. "2022" or "2018, Ch. 1" */
  edition: string;
  sourceType: SourceType;
  /** Table/section within the source, where known. */
  locator?: string;
  notes?: string;
};

/** A value that knows where it came from. */
export type Sourced<T> = {
  value: T;
  sourceId: string;
  sourceType: SourceType;
  edition: string;
  verificationStatus: VerificationStatus;
  notes?: string;
};

/**
 * One line of shown work. `inputs` are the named values substituted into
 * `formula`; `result` is what that line produced.
 */
export type CalculationStep = {
  label: string;
  /** Symbolic form, e.g. "L_total = L_each x qty" */
  formula?: string;
  /** Named inputs with their units, in substitution order. */
  inputs?: StepInput[];
  /** The arithmetic with real numbers substituted, e.g. "2.4 ft x 8" */
  substitution?: string;
  result?: number;
  resultUnit?: string;
  /** Why this step exists, when it is not obvious. */
  note?: string;
};

export type StepInput = {
  name: string;
  value: number | string;
  unit?: string;
};

/** The engine's return shape. Never return a bare number from a public function. */
export type Calculation<T> = {
  value: T;
  unit: string;
  steps: CalculationStep[];
  references: Reference[];
  /** Non-fatal engineering notes raised while calculating (e.g. missing data). */
  warnings?: string[];
};

/** Three-state status. A bare number is never enough — the engineer needs a verdict. */
export type Status = "pass" | "warning" | "fail" | "unknown";

export type StatusAssessment = {
  status: Status;
  /** One-line verdict, e.g. "Within design range". */
  summary: string;
  /** Why this verdict, in engineering terms. */
  reasoning: string;
  references: Reference[];
};

/**
 * Content behind an ⓘ icon. Scope doc section 12 fixes these fields — what it
 * means, why it matters, typical range, consequences either side, and the
 * reference with its classification.
 */
export type ParameterInfo = {
  parameter: string;
  whatItMeans: string;
  whyItMatters: string;
  typicalRange: string;
  ifTooHigh: string;
  ifTooLow: string;
  references: Reference[];
};
