import type { Reference, SourceType, VerificationStatus } from "./types";

/**
 * The shared project model.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THIS FILE IS THE EXTENSION POINT. READ BEFORE ADDING A MODULE.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * The product goal (see CLAUDE.md) is to replace a multi-tab, guess-and-check
 * Excel workflow: the engineer works out values component by component, rolls
 * them into a summary, asks "do these make sense?", and loops. To collapse that
 * loop, every module has to read and write ONE project — not keep its own state.
 *
 * So a module does not own its inputs. It contributes `DesignValue`s to a
 * `Project`, and reads whatever other modules have already contributed. That is
 * what makes the summary view possible, and it is why adding a module does not
 * require touching the ones already here.
 *
 * ## Adding a module (e.g. compressor, evaporator, condenser, load calc)
 *
 * 1. Add its id to `ModuleId` below.
 * 2. Define its inputs/outputs as `DesignValue`s — never bare numbers, so the
 *    provenance and unit travel with the value.
 * 3. Write a pure engine in `lib/<module>/` returning `Calculation<T>` (see
 *    `lib/types.ts`), exactly as `lib/equivalent-length.ts` does.
 * 4. Register the values it publishes in `PROVIDES` so other modules can find
 *    them without importing the module itself.
 *
 * Nothing in steps 1–4 requires editing another module. That is the test of
 * whether this abstraction is doing its job.
 *
 * ## What is deliberately NOT here yet
 *
 * Persistence, accounts and an override audit trail with named users. The DB/WB
 * scope asks for the audit trail; it needs a backend, so `DesignValue` carries
 * the *shape* of an override record (who/when/why) while the storage question
 * stays open. Adding a backend later should not change this model.
 */

/** Modules that can contribute to a project. Add new ones here first. */
export type ModuleId =
  | "entering-air"
  | "line-sizing"
  // Anticipated from Sanjeev's component workbook — not yet built. Listed so the
  // shape of the finished product is visible, and so a module author can see
  // where their work is expected to fit.
  | "compressor"
  | "evaporator"
  | "condenser"
  | "load-calculation";

export const MODULE_LABEL: Record<ModuleId, string> = {
  "entering-air": "Entering Air Conditions",
  "line-sizing": "Line Sizing & Equivalent Length",
  compressor: "Compressor",
  evaporator: "Evaporator",
  condenser: "Condenser",
  "load-calculation": "Load Calculation",
};

/** Modules with a built UI. The rest are declared but not yet implemented. */
export const IMPLEMENTED_MODULES: readonly ModuleId[] = [
  "entering-air",
  "line-sizing",
];

/**
 * Where a value came from. This is the DB/WB scope's "Source Classification"
 * (§Source Classification) and it governs how the value is rendered.
 *
 * Distinct from `SourceType` in types.ts, which classifies the AUTHORITY of a
 * citation (code > standard > manufacturer > recommendation). This classifies
 * the ORIGIN of a particular number in a particular project. A value can be
 * `standard` origin and `recommendation` authority at once.
 */
export type ValueOrigin =
  | "standard" // from an applicable standard's rating condition
  | "professional-input" // typed by the engineer
  | "manufacturer" // from manufacturer data
  | "calculated" // computed by this application
  | "derived" // inferred from another database relationship
  | "user-override" // changed from the recommended value
  | "review-required"; // could not be determined; needs engineering review

export const VALUE_ORIGIN_LABEL: Record<ValueOrigin, string> = {
  standard: "Standard",
  "professional-input": "Professional input",
  manufacturer: "Manufacturer data",
  calculated: "Calculated",
  derived: "Derived",
  "user-override": "User override",
  "review-required": "Review required",
};

/**
 * A record of one override, for the audit trail the DB/WB scope asks for.
 * `by` is unset until there are accounts; the rest is recordable today.
 */
export type OverrideRecord = {
  originalValue: number;
  originalUnit: string;
  newValue: number;
  newUnit: string;
  reason?: string;
  at: string; // ISO timestamp
  by?: string; // requires accounts; see CLAUDE.md deferred list
};

/**
 * A single engineering value with everything needed to explain and audit it.
 *
 * The canonical value is stored in ONE unit (`value` + `canonicalUnit`) and
 * converted for display. Never store parallel °F and °C copies — that is how the
 * source workbook's unit bug happened, and the DB/WB scope forbids it explicitly.
 */
export type DesignValue = {
  /** Stable key, e.g. "indoorDbF". Unique within a module. */
  key: string;
  /** Human label, e.g. "Indoor entering air DB". */
  label: string;
  /** The number, in `canonicalUnit`. `null` = genuinely not applicable/known. */
  value: number | null;
  canonicalUnit: string;
  origin: ValueOrigin;
  /** Citation, when the value came from a document. */
  reference?: Reference;
  sourceType?: SourceType;
  verificationStatus?: VerificationStatus;
  /** Set when the engineer changed it from the recommended value. */
  override?: OverrideRecord;
  /** Short explanation for the "Why?" affordance. */
  why?: string;
  notes?: string;
};

/** What each module publishes into the project, so others can consume it. */
export const PROVIDES: Record<ModuleId, readonly string[]> = {
  "entering-air": [
    "indoorDb",
    "indoorWb",
    "outdoorDb",
    "outdoorWb",
    "relativeHumidity",
    "dewPoint",
    "humidityRatio",
    "enthalpy",
    "specificVolume",
    "airDensity",
  ],
  "line-sizing": [
    "totalEquivalentLength",
    "actualPipeLength",
    "fittingEquivalentLength",
    "componentEquivalentLength",
    "verticalPiping",
    "equivalentLengthMultiplier",
  ],
  compressor: [],
  evaporator: [],
  condenser: [],
  "load-calculation": [],
};

/** Project-level identification, kept separate from any module's data. */
export type ProjectMeta = {
  name: string;
  /** Free text; the engineer's own reference. */
  projectRef?: string;
  country?: string;
  region?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * One design case within a project.
 *
 * A project can hold several — "full load", "part load", "one circuit off" —
 * which is how the line-sizing scope's part-load requirements (§7) and the
 * engineer's "what happens at minimum load?" question get answered without
 * duplicating the whole project.
 */
export type DesignCase = {
  id: string;
  name: string;
  /** Values contributed by each module, keyed by DesignValue.key. */
  values: Partial<Record<ModuleId, Record<string, DesignValue>>>;
};

export type Project = {
  meta: ProjectMeta;
  cases: DesignCase[];
  activeCaseId: string;
};

/* ---------- construction & access ---------- */

export function createDesignCase(name = "Design case 1"): DesignCase {
  return {
    id: `case-${Date.now().toString(36)}`,
    name,
    values: {},
  };
}

export function createProject(name = "Untitled project"): Project {
  const now = new Date().toISOString();
  const first = createDesignCase();
  return {
    meta: { name, createdAt: now, updatedAt: now },
    cases: [first],
    activeCaseId: first.id,
  };
}

export function activeCase(project: Project): DesignCase {
  return project.cases.find((c) => c.id === project.activeCaseId) ?? project.cases[0];
}

/** Read one value contributed by a module, if present. */
export function readValue(
  project: Project,
  moduleId: ModuleId,
  key: string,
): DesignValue | undefined {
  return activeCase(project).values[moduleId]?.[key];
}

/**
 * Write a module's values into the active case, replacing that module's previous
 * contribution. Returns a new Project — never mutates, so React state updates
 * stay predictable.
 */
export function writeModuleValues(
  project: Project,
  moduleId: ModuleId,
  values: Record<string, DesignValue>,
): Project {
  return {
    ...project,
    meta: { ...project.meta, updatedAt: new Date().toISOString() },
    cases: project.cases.map((c) =>
      c.id === project.activeCaseId
        ? { ...c, values: { ...c.values, [moduleId]: values } }
        : c,
    ),
  };
}

/** Every value in the active case, flattened — the basis of the summary view. */
export function allValues(
  project: Project,
): { moduleId: ModuleId; value: DesignValue }[] {
  const out: { moduleId: ModuleId; value: DesignValue }[] = [];
  const c = activeCase(project);
  for (const moduleId of Object.keys(c.values) as ModuleId[]) {
    const moduleValues = c.values[moduleId];
    if (!moduleValues) continue;
    for (const value of Object.values(moduleValues)) {
      out.push({ moduleId, value });
    }
  }
  return out;
}

/** Values needing attention — drives the "does this make sense?" summary. */
export function valuesNeedingReview(project: Project): DesignValue[] {
  return allValues(project)
    .map((v) => v.value)
    .filter(
      (v) => v.origin === "review-required" || v.verificationStatus === "unverified",
    );
}
