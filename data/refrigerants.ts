import type { SourceType, VerificationStatus } from "@/lib/types";

/**
 * Refrigerant classification table.
 *
 * Ported from `sources/line-sizing/refrigerant-reference-table.xlsx`.
 *
 * This table is CLASSIFICATION ONLY — chemical family, blend status, lifecycle
 * stage and typical application. It deliberately carries no thermodynamic
 * properties: density, viscosity and saturation-pressure slope vary continuously
 * with saturation temperature, and a single-point lookup for each (as the
 * prototype used) is only valid at the one operating condition it was tuned for.
 * Real properties come from CoolProp in a later phase; until then this table
 * supports selection and labelling, not pressure-drop physics.
 *
 * Because it is classification rather than measured engineering data, it ports
 * cleanly and is marked `verified` — the classifications are checkable against
 * public ASHRAE Standard 34 designations.
 */

/** Broad chemical family, as given in the source table. */
export type ChemicalFamily =
  | "CFC"
  | "HCFC"
  | "HCFC/HFC Blend"
  | "HFC"
  | "HFC Blend"
  | "HFC/HFO Blend"
  | "HFO"
  | "HFO Blend"
  | "HCFO"
  | "HCFO Blend"
  | "Hydrocarbon"
  | "Natural";

export type Composition = "Pure" | "Blend";

/**
 * Where the refrigerant sits in the phase-down cycle. Free text in the source
 * table; the distinct values are enumerated here so the UI can group and colour
 * them consistently.
 */
export type Lifecycle =
  | "Legacy"
  | "Legacy/Transition"
  | "Transition"
  | "Current"
  | "Current Low-GWP"
  | "Current Component"
  | "Current/Limited"
  | "Emerging"
  | "Limited"
  | "Specialty"
  | "Specialized";

export type Refrigerant = {
  /** ASHRAE Standard 34 designation, e.g. "R-454B". */
  designation: string;
  chemicalFamily: ChemicalFamily;
  /** Finer-grained category; for naturals this names the substance (Ammonia, Water, ...). */
  category: string;
  composition: Composition;
  /** Naturally occurring (ammonia, CO2, hydrocarbons, water, air). */
  natural: boolean;
  lifecycle: Lifecycle;
  typicalApplication: string;
};

const SOURCE = {
  sourceId: "refrigerant-reference-table",
  sourceType: "standard" as SourceType,
  edition: "supplied 2025",
  verificationStatus: "verified" as VerificationStatus,
};

export const REFRIGERANT_SOURCE = SOURCE;

export const REFRIGERANTS: readonly Refrigerant[] = [
  { designation: "R-11", chemicalFamily: "CFC", category: "CFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Large centrifugal chillers" },
  { designation: "R-12", chemicalFamily: "CFC", category: "CFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Refrigeration, automotive AC" },
  { designation: "R-13", chemicalFamily: "CFC", category: "CFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Low-temperature refrigeration" },
  { designation: "R-113", chemicalFamily: "CFC", category: "CFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Specialty cooling" },
  { designation: "R-114", chemicalFamily: "CFC", category: "CFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Industrial refrigeration" },
  { designation: "R-115", chemicalFamily: "CFC", category: "CFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Low-temperature systems" },
  { designation: "R-22", chemicalFamily: "HCFC", category: "HCFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "AC, heat pumps, refrigeration" },
  { designation: "R-123", chemicalFamily: "HCFC", category: "HCFC", composition: "Pure", natural: false, lifecycle: "Legacy/Transition", typicalApplication: "Centrifugal chillers" },
  { designation: "R-124", chemicalFamily: "HCFC", category: "HCFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Refrigeration" },
  { designation: "R-142b", chemicalFamily: "HCFC", category: "HCFC", composition: "Pure", natural: false, lifecycle: "Legacy", typicalApplication: "Foam blowing/component" },
  { designation: "R-401A", chemicalFamily: "HCFC/HFC Blend", category: "HCFC + HFC", composition: "Blend", natural: false, lifecycle: "Legacy", typicalApplication: "R-12 retrofit" },
  { designation: "R-402A", chemicalFamily: "HCFC/HFC Blend", category: "HCFC + HFC", composition: "Blend", natural: false, lifecycle: "Legacy", typicalApplication: "Low-temp refrigeration" },
  { designation: "R-408A", chemicalFamily: "HCFC/HFC Blend", category: "HCFC + HFC", composition: "Blend", natural: false, lifecycle: "Legacy", typicalApplication: "R-502 replacement" },
  { designation: "R-409A", chemicalFamily: "HCFC/HFC Blend", category: "HCFC + HFC", composition: "Blend", natural: false, lifecycle: "Legacy", typicalApplication: "R-12 replacement" },
  { designation: "R-32", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Current", typicalApplication: "AC, heat pumps" },
  { designation: "R-125", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Current Component", typicalApplication: "Used in blends" },
  { designation: "R-134a", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Transition", typicalApplication: "Refrigeration, chillers" },
  { designation: "R-143a", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Transition", typicalApplication: "Blend component" },
  { designation: "R-152a", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Current/Limited", typicalApplication: "Refrigeration, aerosols" },
  { designation: "R-227ea", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Specialty", typicalApplication: "Fire suppression" },
  { designation: "R-236fa", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Specialty", typicalApplication: "Chillers" },
  { designation: "R-245fa", chemicalFamily: "HFC", category: "HFC", composition: "Pure", natural: false, lifecycle: "Transition", typicalApplication: "Organic Rankine Cycle, chillers" },
  { designation: "R-404A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "Commercial refrigeration" },
  { designation: "R-407A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "Refrigeration" },
  { designation: "R-407C", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "AC, heat pumps" },
  { designation: "R-407F", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "Refrigeration" },
  { designation: "R-410A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "AC, heat pumps" },
  { designation: "R-417A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "R-22 retrofit" },
  { designation: "R-422A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "Refrigeration retrofit" },
  { designation: "R-422D", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "Refrigeration retrofit" },
  { designation: "R-424A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "R-22 replacement" },
  { designation: "R-427A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "Air conditioning retrofit" },
  { designation: "R-438A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "R-22 retrofit" },
  { designation: "R-507A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Transition", typicalApplication: "Low-temp refrigeration" },
  { designation: "R-508A", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Specialty", typicalApplication: "Ultra-low temperature" },
  { designation: "R-508B", chemicalFamily: "HFC Blend", category: "HFC", composition: "Blend", natural: false, lifecycle: "Specialty", typicalApplication: "Ultra-low temperature" },
  { designation: "R-448A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Commercial refrigeration" },
  { designation: "R-449A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Commercial refrigeration" },
  { designation: "R-450A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Chillers, refrigeration" },
  { designation: "R-452A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Transport refrigeration" },
  { designation: "R-452B", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "AC systems" },
  { designation: "R-453A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Refrigeration" },
  { designation: "R-454A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Refrigeration" },
  { designation: "R-454B", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "AC, heat pumps" },
  { designation: "R-454C", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Commercial refrigeration" },
  { designation: "R-455A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Refrigeration" },
  { designation: "R-456A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "AC, refrigeration" },
  { designation: "R-457A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "AC, refrigeration" },
  { designation: "R-466A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Emerging", typicalApplication: "R-410A replacement" },
  { designation: "R-513A", chemicalFamily: "HFC/HFO Blend", category: "HFC + HFO", composition: "Blend", natural: false, lifecycle: "Current Low-GWP", typicalApplication: "Chillers, refrigeration" },
  { designation: "R-514A", chemicalFamily: "HCFO Blend", category: "HCFO", composition: "Blend", natural: false, lifecycle: "Current", typicalApplication: "Centrifugal chillers" },
  { designation: "R-515B", chemicalFamily: "HFO Blend", category: "HFO", composition: "Blend", natural: false, lifecycle: "Current", typicalApplication: "Industrial refrigeration" },
  { designation: "R-1234yf", chemicalFamily: "HFO", category: "HFO", composition: "Pure", natural: false, lifecycle: "Current", typicalApplication: "Automotive AC" },
  { designation: "R-1234ze(E)", chemicalFamily: "HFO", category: "HFO", composition: "Pure", natural: false, lifecycle: "Current", typicalApplication: "Chillers, heat pumps" },
  { designation: "R-1234ze(Z)", chemicalFamily: "HFO", category: "HFO", composition: "Pure", natural: false, lifecycle: "Emerging", typicalApplication: "High-temp heat pumps" },
  { designation: "R-1233zd(E)", chemicalFamily: "HCFO", category: "HCFO", composition: "Pure", natural: false, lifecycle: "Current", typicalApplication: "Centrifugal chillers" },
  { designation: "R-1224yd(Z)", chemicalFamily: "HCFO", category: "HCFO", composition: "Pure", natural: false, lifecycle: "Emerging", typicalApplication: "High-temperature applications" },
  { designation: "R-1336mzz(Z)", chemicalFamily: "HFO", category: "HFO", composition: "Pure", natural: false, lifecycle: "Current", typicalApplication: "High-temperature heat pumps" },
  { designation: "R-290", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Refrigeration, AC, heat pumps" },
  { designation: "R-600", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Refrigeration" },
  { designation: "R-600a", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Domestic refrigerators" },
  { designation: "R-601", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Limited", typicalApplication: "Specialty refrigeration" },
  { designation: "R-601a", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Limited", typicalApplication: "Specialty applications" },
  { designation: "R-1270", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Refrigeration, heat pumps" },
  { designation: "R-170", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Cryogenic/low-temp refrigeration" },
  { designation: "R-1150", chemicalFamily: "Hydrocarbon", category: "HC", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Cascade refrigeration" },
  { designation: "R-717", chemicalFamily: "Natural", category: "Ammonia", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Industrial refrigeration" },
  { designation: "R-718", chemicalFamily: "Natural", category: "Water", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Absorption chillers, vacuum systems" },
  { designation: "R-729", chemicalFamily: "Natural", category: "Air", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Specialized refrigeration" },
  { designation: "R-744", chemicalFamily: "Natural", category: "Carbon Dioxide (CO₂)", composition: "Pure", natural: true, lifecycle: "Current", typicalApplication: "Commercial & industrial refrigeration, heat pumps" },
  { designation: "R-740", chemicalFamily: "Natural", category: "Argon", composition: "Pure", natural: true, lifecycle: "Specialized", typicalApplication: "Cryogenic applications" },
  { designation: "R-728", chemicalFamily: "Natural", category: "Nitrogen", composition: "Pure", natural: true, lifecycle: "Specialized", typicalApplication: "Cryogenic refrigeration" },
  { designation: "R-764", chemicalFamily: "Natural", category: "Sulfur Dioxide", composition: "Pure", natural: true, lifecycle: "Legacy", typicalApplication: "Historical refrigeration" },
] as const;

/**
 * Refrigerants the scope doc (section 2) calls out as required. Surfaced first
 * in the selector; the rest of the table remains available below them.
 */
export const PRIORITY_REFRIGERANTS: readonly string[] = [
  "R-454B",
  "R-410A",
  "R-32",
  "R-134a",
  "R-448A",
  "R-449A",
  "R-407C",
  "R-404A",
  "R-1234yf",
  "R-1234ze(E)",
  "R-22",
  "R-507A",
  "R-744",
  "R-717",
  "R-290",
] as const;

const BY_DESIGNATION = new Map(REFRIGERANTS.map((r) => [r.designation, r]));

export function getRefrigerant(designation: string): Refrigerant | undefined {
  return BY_DESIGNATION.get(designation);
}

/** Priority refrigerants first (in scope-doc order), then everything else A-Z. */
export function refrigerantsForSelector(): {
  group: string;
  refrigerants: Refrigerant[];
}[] {
  const priority: Refrigerant[] = [];
  for (const d of PRIORITY_REFRIGERANTS) {
    const r = BY_DESIGNATION.get(d);
    if (r) priority.push(r);
  }
  const prioritySet = new Set(priority.map((r) => r.designation));
  const rest = REFRIGERANTS.filter((r) => !prioritySet.has(r.designation));

  return [
    { group: "Commonly specified", refrigerants: priority },
    { group: "All refrigerants", refrigerants: [...rest] },
  ];
}
