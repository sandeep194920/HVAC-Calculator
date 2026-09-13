import type { ParameterInfo } from "@/lib/types";
import { collectReferences } from "./references";

/**
 * ⓘ content for every major result (scope doc section 12).
 *
 * Each entry answers the same five questions — what it means, why it matters,
 * typical range, too high, too low — and names the reference with its
 * classification. Guidance wording follows Sanjeev's prototype where he had
 * already written it; the classification is stated explicitly so an ASHRAE
 * recommendation is never read as a code minimum.
 */

export type InfoKey =
  | "total-equivalent-length"
  | "actual-pipe-length"
  | "fitting-equivalent-length"
  | "component-equivalent-length"
  | "vertical-piping"
  | "equivalent-length-multiplier";

export const PARAMETER_INFO: Record<InfoKey, ParameterInfo> = {
  "total-equivalent-length": {
    parameter: "Total Equivalent Length",
    whatItMeans:
      "The length of plain straight pipe that would produce the same friction pressure drop as the real run — straight pipe plus every elbow, tee, valve and device expressed as its equivalent in feet of pipe.",
    whyItMatters:
      "Pressure drop is calculated from equivalent length, not from measured pipe length. A run with many elbows and a filter-drier can easily have twice the equivalent length of its physical length, and sizing on the physical length alone undersizes the line.",
    typicalRange:
      "Design practice commonly aims to keep total equivalent length within roughly 100–200 ft for a typical commercial run; beyond that, line size usually has to increase to hold pressure drop within the saturation-temperature penalty allowed.",
    ifTooHigh:
      "Excess pressure drop. On a suction line this lowers compressor suction pressure and costs capacity and efficiency; on a liquid line it risks flashing before the expansion valve.",
    ifTooLow:
      "Not a failure condition in itself. A very low equivalent length relative to the physical run usually means fittings have not yet been entered, so check the configuration is complete before relying on the result.",
    references: collectReferences(["ashrae-refrigeration", "sanjeev-worksheet"]),
  },

  "actual-pipe-length": {
    parameter: "Actual Pipe Length",
    whatItMeans:
      "The measured centre-line length of physical tubing in the run — horizontal sections plus vertical rises and drops. It excludes any allowance for fittings.",
    whyItMatters:
      "It is the base the equivalent length builds on, and the only figure that can be checked against the drawing or a tape measure on site.",
    typicalRange:
      "Set entirely by the installation. Worth confirming against the piping drawing rather than estimating.",
    ifTooHigh:
      "A longer run means more pressure drop for a given size. Where routing allows, shortening the run is usually cheaper than increasing line size.",
    ifTooLow:
      "If the entered length looks short against the drawing, sections are probably missing, which will understate pressure drop.",
    references: collectReferences(["engineering-practice"]),
  },

  "fitting-equivalent-length": {
    parameter: "Fitting Equivalent Length",
    whatItMeans:
      "The combined contribution of elbows, tees and couplings, each converted into the equivalent feet of straight pipe that would cause the same loss.",
    whyItMatters:
      "Fittings are usually the largest single source of underestimated pressure drop. Eight long-radius elbows on a 1-3/8 in line add roughly 19 ft of equivalent pipe — more than most engineers allow for by eye.",
    typicalRange:
      "Highly configuration-dependent. On a typical run, fittings contribute somewhere between 10% and 50% of total equivalent length.",
    ifTooHigh:
      "Consider reducing direction changes, using long-radius rather than standard or street elbows, or increasing line size. A long-radius elbow is often little more than half the equivalent length of a standard one.",
    ifTooLow:
      "Check every fitting in the run has been entered. A near-zero fitting contribution on a real run almost always means the table is incomplete.",
    references: collectReferences(["sanjeev-worksheet", "ashrae-fundamentals"]),
  },

  "component-equivalent-length": {
    parameter: "Valve & Component Equivalent Length",
    whatItMeans:
      "The combined contribution of valves and refrigeration devices — ball, globe, solenoid, angle, gate and check valves, filter-driers, sight glasses, suction filters, expansion valves and hot-gas bypass valves.",
    whyItMatters:
      "Individual components can dominate a run. A 1-3/8 in globe or solenoid valve carries roughly 38 ft of equivalent length against 2.4 ft for a long-radius elbow of the same size — a single valve can outweigh every elbow in the system.",
    typicalRange:
      "Depends on what the circuit requires. Where a component's equivalent length approaches the straight-pipe length, it is worth checking the manufacturer's own pressure-drop data for the specific model rather than relying on a generic table figure.",
    ifTooHigh:
      "Consider a full-port ball valve instead of a globe valve where isolation is the only requirement, or the next size up on the component itself. Filter-drier and suction-filter losses are strongly model-specific and rise sharply as the core loads.",
    ifTooLow:
      "Confirm that service valves, driers and sight glasses have all been included — these are commonly left out of hand calculations.",
    references: collectReferences(["sanjeev-worksheet", "ashrae-fundamentals"]),
  },

  "vertical-piping": {
    parameter: "Vertical Piping (rise / drop)",
    whatItMeans:
      "The net and total vertical content of the run. Vertical pipe contributes to friction length exactly as horizontal pipe does, but it also carries a static head effect that horizontal pipe does not, which is why it is reported separately.",
    whyItMatters:
      "On liquid lines a vertical rise costs static pressure that eats directly into available subcooling and can cause flashing at the expansion valve; a drop returns it. On suction and discharge risers the governing concern is instead velocity — gas must move fast enough to carry oil up the riser back to the compressor.",
    typicalRange:
      "Set by the installation. Liquid-line rises beyond roughly 20–30 ft warrant an explicit check of available subcooling against the static loss.",
    ifTooHigh:
      "A tall liquid-line rise risks flash gas; a tall suction riser risks oil logging at part load, particularly where a compressor unloads or one circuit runs while another is off.",
    ifTooLow:
      "No concern. A run with no vertical content simply has no static head effect.",
    references: collectReferences(["ashrae-refrigeration", "engineering-practice"]),
  },

  "equivalent-length-multiplier": {
    parameter: "Equivalent Length Multiplier",
    whatItMeans:
      "Total equivalent length divided by actual pipe length — how many times longer the run behaves, hydraulically, than it measures.",
    whyItMatters:
      "It is the quickest sanity check on a piping configuration. It converts an abstract total into a single number an engineer can judge at a glance against experience.",
    typicalRange:
      "Roughly 1.2 to 2.0 for a typical run. Simple, straight runs sit near the bottom; fitting-dense machine-room piping sits at the top.",
    ifTooHigh:
      "Above about 2.0, fittings and valves dominate the run. Check for an oversized globe valve or an unnecessarily complex route before accepting a larger line size.",
    ifTooLow:
      "A multiplier at or near 1.0 means almost nothing but straight pipe has been entered. On a real system this usually indicates missing fittings rather than an unusually clean run.",
    references: collectReferences(["engineering-practice"]),
  },
};
