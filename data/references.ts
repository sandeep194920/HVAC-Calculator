import type { Reference } from "@/lib/types";

/**
 * Reference database (scope doc section 13).
 *
 * Every value in `data/` points at one of these by id. Editions are recorded
 * because a citation without an edition cannot be checked.
 *
 * IMPORTANT: the equivalent-length values currently in `data/fittings.ts` were
 * transcribed from Sanjeev's working spreadsheet, which does not itself record
 * which table each figure came from. They are attributed to `sanjeev-worksheet`
 * — the honest citation — and carry `verificationStatus: "unverified"` until
 * each is checked against a licensed copy of the standard it ultimately derives
 * from. Do not re-attribute them to ASHRAE/AHRI without that check.
 */
export const REFERENCES: Record<string, Reference> = {
  "sanjeev-worksheet": {
    id: "sanjeev-worksheet",
    title:
      "Equivalent Length of Pipe Fittings, Valves and Refrigeration Devices — project worksheet (Source Data sheet)",
    edition: "supplied 2025",
    sourceType: "recommendation",
    locator: "sources/line-sizing/equivalent-length-calculations.xlsx",
    notes:
      "Transcribed as supplied. Values are in FEET. The workbook's separate 'Equivalent Length' sheet contains a feet/inches unit error and was not used. Underlying standard for each row is not recorded in the workbook and must be established during verification.",
  },

  "ashrae-refrigeration": {
    id: "ashrae-refrigeration",
    title: "ASHRAE Handbook — Refrigeration, Ch. 1 'Halocarbon Refrigeration Systems'",
    edition: "2022",
    sourceType: "standard",
    locator: "Piping design, velocity and pressure-drop guidance",
    notes:
      "Cited for design guidance only. ASHRAE publishes recommended practice here, not a code minimum — must not be rendered as a requirement.",
  },

  "ashrae-fundamentals": {
    id: "ashrae-fundamentals",
    title: "ASHRAE Handbook — Fundamentals, Ch. 22 'Pipe Sizing'",
    edition: "2021",
    sourceType: "standard",
    locator: "Equivalent length of valves and fittings",
  },

  "ashrae-fundamentals-psychrometrics": {
    id: "ashrae-fundamentals-psychrometrics",
    title: "ASHRAE Handbook — Fundamentals, Ch. 1 'Psychrometrics'",
    edition: "2021",
    sourceType: "standard",
    locator:
      "Eq. 5/6 (saturation pressure), Eq. 28 (specific volume), Eq. 30 (enthalpy), Eq. 33/34 (humidity ratio from wet-bulb), Eq. 37/38 (dew point)",
    notes:
      "Moist-air property correlations. These are established physical relationships rather than design guidance — the equations themselves are not in dispute, though the implementation is verified against ASHRAE's own published example states.",
  },

  "engineering-practice": {
    id: "engineering-practice",
    title: "General refrigeration piping engineering practice",
    edition: "n/a",
    sourceType: "recommendation",
    notes:
      "Used where a figure is common design practice with no single authoritative published source. Lowest-authority classification; always shown as a recommendation.",
  },
};

export function getReference(id: string): Reference {
  const ref = REFERENCES[id];
  if (!ref) throw new Error(`Unknown reference id: ${id}`);
  return ref;
}

/** Collect unique references by id, preserving first-seen order. */
export function collectReferences(ids: readonly string[]): Reference[] {
  const seen = new Set<string>();
  const out: Reference[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(getReference(id));
  }
  return out;
}
