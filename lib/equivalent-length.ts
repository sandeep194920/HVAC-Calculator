import type {
  Calculation,
  CalculationStep,
  Reference,
  Status,
  StatusAssessment,
} from "./types";
import { lengthToFt, round } from "./units";
import type { LengthUnit } from "./units";
import {
  getFitting,
  getValveRange,
  lookupEquivalentLengthFt,
  type FittingId,
  type NominalSize,
  type ValveRangeDefinition,
} from "@/data/fittings";
import { collectReferences } from "@/data/references";
import {
  EQUIVALENT_LENGTH_MULTIPLIER_LIMIT,
  TOTAL_EQUIVALENT_LENGTH_LIMIT,
  type UpperBandLimit,
} from "@/data/limits";

/**
 * The equivalent-length engine.
 *
 * Pure TypeScript, no React. Every public function returns a `Calculation<T>`
 * carrying the formula, the substituted arithmetic and the references, so the UI
 * can render "Show Calculation" without re-deriving anything.
 *
 * Canonical unit throughout: FEET. Input rows carry their own unit and are
 * converted once, on entry, with the conversion recorded as a visible step.
 * Nothing downstream ever sees a mixed-unit number — that is the source
 * workbook's bug, and the structure here is what makes it unrepresentable.
 */

/* ---------------- Row model ---------------- */

export type StraightKind = "horizontal" | "rise" | "drop";

/** A length of physical pipe. Contributes actual length; no equivalent allowance. */
export type StraightRow = {
  id: string;
  kind: "straight";
  straightKind: StraightKind;
  size: NominalSize;
  /** As entered by the user, in `lengthUnit`. */
  length: number;
  lengthUnit: LengthUnit;
  quantity: number;
  label?: string;
};

/** A fitting, valve or device looked up from the fitting database. */
export type FittingRow = {
  id: string;
  kind: "fitting";
  fittingId: FittingId;
  size: NominalSize;
  quantity: number;
  label?: string;
};

/**
 * An EXV or hot-gas-bypass valve. The source data gives a range rather than a
 * single figure, so these carry the spread through to the result instead of
 * collapsing to a midpoint silently.
 */
export type ValveRangeRow = {
  id: string;
  kind: "valve-range";
  valveId: ValveRangeDefinition["id"];
  connectionSize: string;
  quantity: number;
  label?: string;
};

export type ConfigurationRow = StraightRow | FittingRow | ValveRangeRow;

/* ---------------- Per-row result ---------------- */

export type RowContribution = {
  rowId: string;
  /** Display name for the row, e.g. "90° Elbow — Long Radius". */
  name: string;
  size: string;
  quantity: number;
  /** Physical pipe length in ft. Zero for fittings. */
  actualLengthFt: number;
  /** Per-unit equivalent length in ft. `null` when the data is absent. */
  eachEquivalentLengthFt: number | null;
  /** quantity x each, in ft. `null` when data is absent — never silently 0. */
  totalEquivalentLengthFt: number | null;
  /** What this row contributes to the grand total, in ft. */
  contributionFt: number;
  /** Which breakdown bucket this row lands in (scope doc section 5). */
  bucket: BreakdownBucket;
  /** Set when the fitting database has no value for this size. */
  missingData: boolean;
  /** Range spread for EXV/HGBV rows, which have no single value. */
  rangeFt?: { minFt: number; maxFt: number };
  steps: CalculationStep[];
  sourceIds: string[];
  verificationStatus: string;
};

/** The breakdown scope doc section 5 requires. */
export type BreakdownBucket =
  | "actual-pipe"
  | "fittings"
  | "components"
  | "vertical";

export type Breakdown = {
  /** Straight horizontal pipe, ft. */
  actualPipeLengthFt: number;
  /** Elbows, tees, couplings, ft. */
  fittingEquivalentLengthFt: number;
  /** Valves and refrigeration devices, ft. */
  componentEquivalentLengthFt: number;
  /** Vertical pipe, ft — counted in the total, reported separately. */
  verticalPipingFt: number;
  /** Rise and drop split out, because their static-head effects have opposite sign. */
  verticalRiseFt: number;
  verticalDropFt: number;
  /** All physical pipe: horizontal + vertical. */
  totalActualLengthFt: number;
  totalEquivalentLengthFt: number;
  /** totalEquivalent / totalActual. `null` when there is no physical pipe to divide by. */
  multiplier: number | null;
};

export type EquivalentLengthResult = {
  breakdown: Breakdown;
  rows: RowContribution[];
  total: Calculation<number>;
  multiplier: Calculation<number | null>;
  /** Rows whose data is absent, for a visible banner rather than a silent zero. */
  missingDataRows: RowContribution[];
  assessments: {
    totalEquivalentLength: StatusAssessment;
    multiplier: StatusAssessment;
  };
};

/* ---------------- Row evaluation ---------------- */

function evaluateStraight(row: StraightRow): RowContribution {
  const steps: CalculationStep[] = [];

  const lengthFt = lengthToFt(row.length, row.lengthUnit);

  // The conversion is shown even when it is a no-op, so the engineer can see
  // which unit the number entered the engine in. This is the class of error the
  // source workbook made invisible.
  steps.push({
    label: "Convert to canonical unit",
    formula: "L_ft = L_entered -> ft",
    inputs: [{ name: "L_entered", value: row.length, unit: row.lengthUnit }],
    substitution:
      row.lengthUnit === "ft"
        ? `${row.length} ft (already canonical)`
        : `${row.length} ${row.lengthUnit} = ${round(lengthFt, 4)} ft`,
    result: round(lengthFt, 4),
    resultUnit: "ft",
  });

  const totalFt = lengthFt * row.quantity;
  if (row.quantity !== 1) {
    steps.push({
      label: "Apply quantity",
      formula: "L_total = L_ft x qty",
      inputs: [
        { name: "L_ft", value: round(lengthFt, 4), unit: "ft" },
        { name: "qty", value: row.quantity },
      ],
      substitution: `${round(lengthFt, 4)} ft x ${row.quantity}`,
      result: round(totalFt, 4),
      resultUnit: "ft",
    });
  }

  const kindLabel =
    row.straightKind === "horizontal"
      ? "Straight Pipe (horizontal)"
      : row.straightKind === "rise"
        ? "Vertical Rise"
        : "Vertical Drop";

  return {
    rowId: row.id,
    name: row.label?.trim() || kindLabel,
    size: row.size,
    quantity: row.quantity,
    actualLengthFt: totalFt,
    // Straight pipe has no equivalent-length allowance: it IS the pipe. Shown as
    // "—" in the table rather than 0, matching the scope doc's example table.
    eachEquivalentLengthFt: null,
    totalEquivalentLengthFt: null,
    contributionFt: totalFt,
    bucket: row.straightKind === "horizontal" ? "actual-pipe" : "vertical",
    missingData: false,
    steps,
    sourceIds: [],
    verificationStatus: "n/a",
  };
}

function evaluateFitting(row: FittingRow): RowContribution {
  const fitting = getFitting(row.fittingId);
  const eachFt = lookupEquivalentLengthFt(row.fittingId, row.size);
  const steps: CalculationStep[] = [];

  if (eachFt === null) {
    // Absent data. Contribute nothing and say so loudly — adding 0 here would
    // understate the run and look identical on screen to a genuine zero.
    steps.push({
      label: "Look up equivalent length",
      formula: "L_eq = table(fitting, size)",
      inputs: [
        { name: "fitting", value: fitting.name },
        { name: "size", value: `${row.size}"` },
      ],
      substitution: "no value in source data for this size",
      note: "This row is excluded from the total. It is not treated as zero — the source table simply has no figure for this fitting at this size. Enter a manufacturer value to include it.",
    });

    return {
      rowId: row.id,
      name: row.label?.trim() || fitting.name,
      size: row.size,
      quantity: row.quantity,
      actualLengthFt: 0,
      eachEquivalentLengthFt: null,
      totalEquivalentLengthFt: null,
      contributionFt: 0,
      bucket: bucketFor(row.fittingId),
      missingData: true,
      steps,
      sourceIds: [fitting.sourceId],
      verificationStatus: fitting.verificationStatus,
    };
  }

  steps.push({
    label: "Look up equivalent length",
    formula: "L_eq = table(fitting, size)",
    inputs: [
      { name: "fitting", value: fitting.name },
      { name: "size", value: `${row.size}"` },
    ],
    substitution: `${eachFt} ft each`,
    result: eachFt,
    resultUnit: "ft",
    note: "Source data is in feet. No unit conversion is applied.",
  });

  const totalFt = eachFt * row.quantity;
  steps.push({
    label: "Apply quantity",
    formula: "L_total = L_eq x qty",
    inputs: [
      { name: "L_eq", value: eachFt, unit: "ft" },
      { name: "qty", value: row.quantity },
    ],
    substitution: `${eachFt} ft x ${row.quantity}`,
    result: round(totalFt, 4),
    resultUnit: "ft",
  });

  return {
    rowId: row.id,
    name: row.label?.trim() || fitting.name,
    size: row.size,
    quantity: row.quantity,
    actualLengthFt: 0,
    eachEquivalentLengthFt: eachFt,
    totalEquivalentLengthFt: totalFt,
    contributionFt: totalFt,
    bucket: bucketFor(row.fittingId),
    missingData: false,
    steps,
    sourceIds: [fitting.sourceId],
    verificationStatus: fitting.verificationStatus,
  };
}

function evaluateValveRange(row: ValveRangeRow): RowContribution {
  const valve = getValveRange(row.valveId);
  const range = valve.byConnectionSize[row.connectionSize];
  const steps: CalculationStep[] = [];

  if (!range) {
    steps.push({
      label: "Look up equivalent length",
      formula: "L_eq = table(valve, connection size)",
      inputs: [
        { name: "valve", value: valve.name },
        { name: "connection", value: row.connectionSize },
      ],
      substitution: "no value in source data for this connection size",
      note: "Excluded from the total rather than treated as zero.",
    });
    return {
      rowId: row.id,
      name: row.label?.trim() || valve.name,
      size: row.connectionSize,
      quantity: row.quantity,
      actualLengthFt: 0,
      eachEquivalentLengthFt: null,
      totalEquivalentLengthFt: null,
      contributionFt: 0,
      bucket: "components",
      missingData: true,
      steps,
      sourceIds: [valve.sourceId],
      verificationStatus: valve.verificationStatus,
    };
  }

  // The source gives a range. The midpoint is used for the total, and the spread
  // is carried through so the UI can show what the figure actually rests on.
  const midFt = (range.minFt + range.maxFt) / 2;

  steps.push({
    label: "Look up equivalent length range",
    formula: "L_eq in [L_min, L_max]",
    inputs: [
      { name: "valve", value: valve.name },
      { name: "connection", value: row.connectionSize },
    ],
    substitution: `${range.minFt}–${range.maxFt} ft each`,
    note: "The source gives a range, not a single value — actual loss depends on port size and valve position.",
  });

  steps.push({
    label: "Take range midpoint",
    formula: "L_mid = (L_min + L_max) / 2",
    inputs: [
      { name: "L_min", value: range.minFt, unit: "ft" },
      { name: "L_max", value: range.maxFt, unit: "ft" },
    ],
    substitution: `(${range.minFt} + ${range.maxFt}) / 2`,
    result: round(midFt, 4),
    resultUnit: "ft",
    note: "Midpoint is an interim figure. Substitute manufacturer data for the specific valve where a firm number is needed.",
  });

  const totalFt = midFt * row.quantity;
  steps.push({
    label: "Apply quantity",
    formula: "L_total = L_mid x qty",
    inputs: [
      { name: "L_mid", value: round(midFt, 4), unit: "ft" },
      { name: "qty", value: row.quantity },
    ],
    substitution: `${round(midFt, 4)} ft x ${row.quantity}`,
    result: round(totalFt, 4),
    resultUnit: "ft",
  });

  return {
    rowId: row.id,
    name: row.label?.trim() || valve.name,
    size: row.connectionSize,
    quantity: row.quantity,
    actualLengthFt: 0,
    eachEquivalentLengthFt: midFt,
    totalEquivalentLengthFt: totalFt,
    contributionFt: totalFt,
    bucket: "components",
    missingData: false,
    rangeFt: {
      minFt: range.minFt * row.quantity,
      maxFt: range.maxFt * row.quantity,
    },
    steps,
    sourceIds: [valve.sourceId],
    verificationStatus: valve.verificationStatus,
  };
}

/** Elbows/tees/couplings are "fittings"; valves and devices are "components". */
function bucketFor(fittingId: FittingId): BreakdownBucket {
  const category = getFitting(fittingId).category;
  return category === "valve" || category === "device" ? "components" : "fittings";
}

export function evaluateRow(row: ConfigurationRow): RowContribution {
  switch (row.kind) {
    case "straight":
      return evaluateStraight(row);
    case "fitting":
      return evaluateFitting(row);
    case "valve-range":
      return evaluateValveRange(row);
  }
}

/* ---------------- Assessment against limits ---------------- */

function assessAgainstUpperBand(
  value: number | null,
  limit: UpperBandLimit,
  passSummary: string,
): StatusAssessment {
  const refs = collectReferences([limit.sourceId]);

  if (value === null) {
    return {
      status: "unknown",
      summary: "Not evaluated",
      reasoning:
        "There is no physical pipe length in the configuration, so this parameter cannot be calculated.",
      references: refs,
    };
  }

  let status: Status = "pass";
  let summary = passSummary;

  if (limit.failAbove !== null && value > limit.failAbove) {
    status = "fail";
    summary = `Above ${limit.failAbove}${limit.unit === "x" ? "x" : ` ${limit.unit}`} — not recommended`;
  } else if (limit.warnAbove !== null && value > limit.warnAbove) {
    status = "warning";
    summary = `Above ${limit.warnAbove}${limit.unit === "x" ? "x" : ` ${limit.unit}`} — engineering review`;
  }

  return {
    status,
    summary,
    reasoning: limit.rationale,
    references: refs,
  };
}

/* ---------------- Top-level calculation ---------------- */

export function calculateEquivalentLength(
  rows: readonly ConfigurationRow[],
): EquivalentLengthResult {
  const contributions = rows.map(evaluateRow);

  const sumBucket = (bucket: BreakdownBucket) =>
    contributions
      .filter((c) => c.bucket === bucket)
      .reduce((acc, c) => acc + c.contributionFt, 0);

  const actualPipeLengthFt = sumBucket("actual-pipe");
  const fittingEquivalentLengthFt = sumBucket("fittings");
  const componentEquivalentLengthFt = sumBucket("components");
  const verticalPipingFt = sumBucket("vertical");

  // Rise and drop are split from the typed row, not by matching the display
  // label, so a user-supplied row label can never change the arithmetic.
  const sumStraight = (straightKind: StraightKind) =>
    rows
      .filter((r): r is StraightRow => r.kind === "straight" && r.straightKind === straightKind)
      .reduce((acc, r) => acc + lengthToFt(r.length, r.lengthUnit) * r.quantity, 0);

  const riseFt = sumStraight("rise");
  const dropFt = sumStraight("drop");

  const totalActualLengthFt = actualPipeLengthFt + verticalPipingFt;
  const totalEquivalentLengthFt =
    totalActualLengthFt + fittingEquivalentLengthFt + componentEquivalentLengthFt;

  const multiplier =
    totalActualLengthFt > 0 ? totalEquivalentLengthFt / totalActualLengthFt : null;

  const missingDataRows = contributions.filter((c) => c.missingData);

  /* --- shown work for the total --- */

  const totalSteps: CalculationStep[] = [
    {
      label: "Total equivalent length",
      formula: "L_eq,total = L_pipe + L_vertical + Σ(L_fitting x qty) + Σ(L_component x qty)",
      note: "All terms are in feet. No term is converted mid-sum.",
    },
    {
      label: "Straight pipe (horizontal)",
      substitution: summariseBucket(contributions, "actual-pipe"),
      result: round(actualPipeLengthFt, 2),
      resultUnit: "ft",
    },
    {
      label: "Vertical piping (rise + drop)",
      substitution: summariseBucket(contributions, "vertical"),
      result: round(verticalPipingFt, 2),
      resultUnit: "ft",
      note: "Vertical pipe adds friction length exactly as horizontal pipe does; it is reported separately because it also carries a static-head effect.",
    },
    {
      label: "Fittings (elbows, tees, couplings)",
      substitution: summariseBucket(contributions, "fittings"),
      result: round(fittingEquivalentLengthFt, 2),
      resultUnit: "ft",
    },
    {
      label: "Valves & components",
      substitution: summariseBucket(contributions, "components"),
      result: round(componentEquivalentLengthFt, 2),
      resultUnit: "ft",
    },
    {
      label: "Sum",
      substitution: `${round(actualPipeLengthFt, 2)} + ${round(verticalPipingFt, 2)} + ${round(
        fittingEquivalentLengthFt,
        2,
      )} + ${round(componentEquivalentLengthFt, 2)}`,
      result: round(totalEquivalentLengthFt, 2),
      resultUnit: "ft",
    },
  ];

  const warnings: string[] = [];
  if (missingDataRows.length > 0) {
    warnings.push(
      `${missingDataRows.length} row${missingDataRows.length === 1 ? "" : "s"} excluded from the total: the source data has no equivalent length for that fitting at that size. The total is therefore an underestimate.`,
    );
  }

  const allSourceIds = contributions.flatMap((c) => c.sourceIds);
  const references: Reference[] = collectReferences(
    allSourceIds.length > 0 ? allSourceIds : ["engineering-practice"],
  );

  const total: Calculation<number> = {
    value: round(totalEquivalentLengthFt, 2),
    unit: "ft",
    steps: totalSteps,
    references,
    warnings: warnings.length > 0 ? warnings : undefined,
  };

  /* --- shown work for the multiplier --- */

  const multiplierSteps: CalculationStep[] =
    multiplier === null
      ? [
          {
            label: "Equivalent length multiplier",
            formula: "M = L_eq,total / L_actual",
            note: "Not calculated: there is no physical pipe length to divide by. Add a straight-pipe section.",
          },
        ]
      : [
          {
            label: "Equivalent length multiplier",
            formula: "M = L_eq,total / L_actual",
            inputs: [
              { name: "L_eq,total", value: round(totalEquivalentLengthFt, 2), unit: "ft" },
              { name: "L_actual", value: round(totalActualLengthFt, 2), unit: "ft" },
            ],
            substitution: `${round(totalEquivalentLengthFt, 2)} ft / ${round(totalActualLengthFt, 2)} ft`,
            result: round(multiplier, 2),
            resultUnit: "x",
            note: "L_actual is all physical pipe — horizontal plus vertical — not horizontal alone.",
          },
        ];

  return {
    breakdown: {
      actualPipeLengthFt,
      fittingEquivalentLengthFt,
      componentEquivalentLengthFt,
      verticalPipingFt,
      verticalRiseFt: riseFt,
      verticalDropFt: dropFt,
      totalActualLengthFt,
      totalEquivalentLengthFt,
      multiplier,
    },
    rows: contributions,
    total,
    multiplier: {
      value: multiplier === null ? null : round(multiplier, 2),
      unit: "x",
      steps: multiplierSteps,
      references: collectReferences(["engineering-practice"]),
    },
    missingDataRows,
    assessments: {
      totalEquivalentLength: assessAgainstUpperBand(
        totalEquivalentLengthFt,
        TOTAL_EQUIVALENT_LENGTH_LIMIT,
        "Within typical design range",
      ),
      multiplier: assessAgainstUpperBand(
        multiplier,
        EQUIVALENT_LENGTH_MULTIPLIER_LIMIT,
        "Typical for a refrigeration run",
      ),
    },
  };
}

/** "2.4 ft x 8 + 3.6 ft x 2" — the arithmetic, with real numbers in it. */
function summariseBucket(
  contributions: readonly RowContribution[],
  bucket: BreakdownBucket,
): string {
  const inBucket = contributions.filter((c) => c.bucket === bucket && !c.missingData);
  if (inBucket.length === 0) return "0 ft (no rows)";

  return inBucket
    .map((c) => {
      const each =
        c.eachEquivalentLengthFt ?? (c.quantity > 0 ? c.actualLengthFt / c.quantity : 0);
      return c.quantity === 1
        ? `${round(each, 2)} ft`
        : `${round(each, 2)} ft x ${c.quantity}`;
    })
    .join(" + ");
}

/* ---------------- Row construction helpers ---------------- */

let rowCounter = 0;

/** Stable-enough ids for React keys; the engine itself never depends on them. */
export function nextRowId(prefix = "row"): string {
  rowCounter += 1;
  return `${prefix}-${rowCounter}-${Math.random().toString(36).slice(2, 7)}`;
}
