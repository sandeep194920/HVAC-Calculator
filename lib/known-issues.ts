/**
 * Known issues in the source material, surfaced in the UI rather than silently
 * corrected. Sanjeev needs to know which of his existing design documents used
 * the bad figures — quietly fixing them would hide that.
 */

export type KnownIssue = {
  id: string;
  title: string;
  /** Where the problem is. */
  location: string;
  description: string;
  /** What this calculator does instead. */
  resolution: string;
  severity: "high" | "medium";
};

export const KNOWN_SOURCE_ISSUES: readonly KnownIssue[] = [
  {
    id: "eqlen-feet-inches",
    title: "Feet/inches unit error in the source workbook's worked examples",
    location:
      'sources/line-sizing/equivalent-length-calculations.xlsx — "Equivalent Length" sheet',
    description:
      'Fitting equivalent lengths on the "Source Data" sheet are in feet (a 1-3/8" 90° long-radius elbow is 2.4 ft). The "Equivalent Length" sheet enters that same fitting as 28.8 — that is 2.4 x 12, i.e. inches. It then adds the total pipe length, which is in feet, to that inches figure, and converts the sum with CONVERT(...,"in","ft"). Mixing the two units and then converting once makes the reported totals roughly 12x too small. Example: the "Suction Lines - Compressor 1 & 2" run reports 34.1 ft, but its 103 ft of straight pipe alone already exceeds that.',
    resolution:
      "This calculator stores every equivalent length in feet and never converts a mixed-unit sum. The Source Data sheet is treated as authoritative. The workbook's worked examples are not reproduced.",
    severity: "high",
  },
  {
    id: "size-date-coercion",
    title: "Pipe sizes coerced into dates by Excel",
    location:
      'sources/line-sizing/equivalent-length-calculations.xlsx — "Equivalent Length" sheet, Size cells',
    description:
      'Several Size cells read 46150 or 46089 instead of a pipe size. Excel interpreted entries such as 1-1/8 as dates and stored them as serial numbers. The affected rows are in the worked examples, not in the Source Data sheet.',
    resolution:
      "Sizes here are a fixed set of typed nominal values, not free text, so they cannot be coerced. Source Data sheet values were used for all fitting data.",
    severity: "medium",
  },
  {
    id: "non-monotonic-3-4",
    title: '3/4" values run below their neighbours in three rows',
    location: 'sources/line-sizing/equivalent-length-calculations.xlsx — "Source Data" sheet',
    description:
      'For the 45° standard elbow (0.6 ft), globe/solenoid valve (14 ft) and sight glass (0.9 ft), the 3/4" figure is lower than the 5/8" figure above it, where every other row increases with size. This may be correct — 3/4" is a less common line size and the data may come from a different table — but it is unusual enough to check.',
    resolution:
      "Transcribed exactly as given, not smoothed. Flagged on the affected rows for verification.",
    severity: "medium",
  },
];
