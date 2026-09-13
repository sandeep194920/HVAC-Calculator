import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculateEquivalentLength,
  evaluateRow,
  type ConfigurationRow,
} from "./equivalent-length.ts";
import {
  FITTINGS,
  NOMINAL_SIZES,
  lookupEquivalentLengthFt,
  availableSizes,
} from "../data/fittings.ts";
import {
  lengthToFt,
  lengthFromFt,
  temperatureToF,
  temperatureFromF,
  temperatureDeltaFromF,
  pressureToPsi,
  capacityToTon,
} from "./units.ts";

/* ---------------- units ---------------- */

test("length converts to feet and back without drift", () => {
  assert.equal(lengthToFt(12, "in"), 1);
  assert.equal(lengthToFt(1, "ft"), 1);
  assert.ok(Math.abs(lengthToFt(1, "m") - 3.280839895) < 1e-6);
  assert.ok(Math.abs(lengthToFt(1000, "mm") - 3.280839895) < 1e-6);

  for (const unit of ["ft", "in", "m", "mm"] as const) {
    const roundTripped = lengthFromFt(lengthToFt(37.5, unit), unit);
    assert.ok(Math.abs(roundTripped - 37.5) < 1e-9, `round trip failed for ${unit}`);
  }
});

test("absolute temperature and temperature difference convert differently", () => {
  assert.equal(temperatureToF(0, "C"), 32);
  assert.equal(temperatureToF(100, "C"), 212);
  assert.ok(Math.abs(temperatureFromF(32, "C")) < 1e-9);

  // A 2 degF design allowance is 1.11 degC, NOT -16.7 degC. Conflating the
  // affine and ratio conversions is a classic source of nonsense limits.
  assert.ok(Math.abs(temperatureDeltaFromF(2, "C") - 1.1111) < 1e-3);
  assert.notEqual(temperatureDeltaFromF(2, "C"), temperatureFromF(2, "C"));
});

test("pressure and capacity convert against known anchors", () => {
  assert.ok(Math.abs(pressureToPsi(1, "bar") - 14.5038) < 1e-3);
  assert.ok(Math.abs(capacityToTon(12000, "btuh") - 1) < 1e-9);
  assert.ok(Math.abs(capacityToTon(3.516853, "kW") - 1) < 1e-6);
});

/* ---------------- source data integrity ---------------- */

test("every fitting row has provenance and is marked unverified", () => {
  for (const f of FITTINGS) {
    assert.ok(f.sourceId, `${f.id} has no sourceId`);
    assert.ok(f.edition, `${f.id} has no edition`);
    assert.equal(
      f.verificationStatus,
      "unverified",
      `${f.id} must stay unverified until checked against a licensed copy`,
    );
  }
});

test("spot-checks match the Source Data sheet exactly, in feet", () => {
  // The value CLAUDE.md names explicitly: 1-3/8" 90 deg long-radius elbow.
  assert.equal(lookupEquivalentLengthFt("elbow-90-long-radius", "1-3/8"), 2.4);
  // Not the workbook's 28.8, which is that value wrongly expressed in inches.
  assert.notEqual(lookupEquivalentLengthFt("elbow-90-long-radius", "1-3/8"), 28.8);

  assert.equal(lookupEquivalentLengthFt("elbow-90-std", "1/2"), 1.4);
  assert.equal(lookupEquivalentLengthFt("valve-globe-solenoid", "8-1/8"), 220);
  assert.equal(lookupEquivalentLengthFt("tee-branch-flow", "1-1/8"), 5);
  assert.equal(lookupEquivalentLengthFt("device-filter-drier", "1-3/8"), 35);
  assert.equal(lookupEquivalentLengthFt("valve-ball", "1-3/8"), 1);
});

test("dashes in the source sheet are absent, not zero", () => {
  // A 3/4" 90 deg street elbow is "—" on the source sheet.
  assert.equal(lookupEquivalentLengthFt("elbow-90-street", "3/4"), null);
  assert.equal(lookupEquivalentLengthFt("device-filter-drier", "1-5/8"), null);
  assert.equal(lookupEquivalentLengthFt("coupling-enlarging-1-4", "4-1/8"), null);

  // and absent sizes are excluded from the picker rather than offered as zero
  assert.ok(!availableSizes("elbow-90-street").includes("3/4"));
  assert.ok(availableSizes("elbow-90-std").includes("3/4"));
});

test("no fitting value is negative and every size key is a known size", () => {
  for (const f of FITTINGS) {
    for (const [size, value] of Object.entries(f.equivalentLengthFt)) {
      assert.ok(
        (NOMINAL_SIZES as readonly string[]).includes(size),
        `${f.id} has unknown size key ${size}`,
      );
      if (value !== null) {
        assert.ok(value > 0, `${f.id} at ${size} is not positive`);
      }
    }
  }
});

/* ---------------- engine ---------------- */

const straight = (
  length: number,
  straightKind: "horizontal" | "rise" | "drop" = "horizontal",
  lengthUnit: "ft" | "in" | "m" | "mm" = "ft",
): ConfigurationRow => ({
  id: `s-${length}-${straightKind}-${lengthUnit}`,
  kind: "straight",
  straightKind,
  size: "1-3/8",
  length,
  lengthUnit,
  quantity: 1,
});

test("total equals straight pipe plus fitting equivalents, all in feet", () => {
  const rows: ConfigurationRow[] = [
    straight(80),
    {
      id: "f1",
      kind: "fitting",
      fittingId: "elbow-90-long-radius",
      size: "1-3/8",
      quantity: 8,
    },
    { id: "f2", kind: "fitting", fittingId: "valve-ball", size: "1-3/8", quantity: 1 },
  ];

  const result = calculateEquivalentLength(rows);

  // 80 + (2.4 x 8) + (1.0 x 1) = 80 + 19.2 + 1 = 100.2
  assert.equal(result.breakdown.actualPipeLengthFt, 80);
  assert.equal(result.breakdown.fittingEquivalentLengthFt, 19.2);
  assert.equal(result.breakdown.componentEquivalentLengthFt, 1);
  assert.equal(result.total.value, 100.2);
  assert.equal(result.multiplier.value, 1.25);
});

test("the source workbook's feet/inches error is not reproduced", () => {
  // Workbook "Suction Lines - Compressor 1 & 2": 103 ft of pipe, 4x + 5x
  // 1-3/8" 90 deg LR elbows, a reducer and a valve. It reports 34.08 ft total —
  // less than the straight pipe alone, because it summed feet and inches and
  // then converted once.
  const rows: ConfigurationRow[] = [
    straight(103),
    {
      id: "e1",
      kind: "fitting",
      fittingId: "elbow-90-long-radius",
      size: "1-3/8",
      quantity: 9,
    },
  ];

  const result = calculateEquivalentLength(rows);

  // 103 + (2.4 x 9) = 124.6
  assert.equal(result.total.value, 124.6);
  // The total must never fall below the physical pipe it contains.
  assert.ok(result.total.value >= result.breakdown.totalActualLengthFt);
  assert.ok(result.total.value > 34.09, "reproduces the workbook's 12x-too-small total");
});

test("total is never less than the physical pipe length, across many configurations", () => {
  for (const size of NOMINAL_SIZES) {
    for (const f of FITTINGS) {
      const rows: ConfigurationRow[] = [
        straight(50),
        { id: "f", kind: "fitting", fittingId: f.id, size, quantity: 3 },
      ];
      const r = calculateEquivalentLength(rows);
      assert.ok(
        r.total.value >= 50,
        `${f.id} at ${size} produced a total below its straight pipe`,
      );
    }
  }
});

test("mixed input units are converted once, on entry", () => {
  const rows: ConfigurationRow[] = [
    straight(10, "horizontal", "ft"),
    straight(120, "horizontal", "in"), // = 10 ft
    straight(3.048, "horizontal", "m"), // = 10 ft
    straight(3048, "horizontal", "mm"), // = 10 ft
  ];

  const result = calculateEquivalentLength(rows);
  assert.ok(Math.abs(result.breakdown.actualPipeLengthFt - 40) < 1e-6);
  assert.ok(Math.abs(result.total.value - 40) < 0.01);
});

test("vertical rise and drop both add friction length but are reported separately", () => {
  const rows: ConfigurationRow[] = [
    straight(50, "horizontal"),
    straight(20, "rise"),
    straight(10, "drop"),
  ];

  const result = calculateEquivalentLength(rows);
  assert.equal(result.breakdown.actualPipeLengthFt, 50);
  assert.equal(result.breakdown.verticalPipingFt, 30);
  assert.equal(result.breakdown.verticalRiseFt, 20);
  assert.equal(result.breakdown.verticalDropFt, 10);
  // Vertical pipe is real pipe: it counts in the total.
  assert.equal(result.total.value, 80);
  assert.equal(result.breakdown.totalActualLengthFt, 80);
});

test("a row label cannot change the rise/drop arithmetic", () => {
  const rows: ConfigurationRow[] = [
    straight(50, "horizontal"),
    { ...(straight(20, "drop") as ConfigurationRow), label: "rise to ceiling" },
  ];
  const result = calculateEquivalentLength(rows);
  assert.equal(result.breakdown.verticalDropFt, 20);
  assert.equal(result.breakdown.verticalRiseFt, 0);
});

test("missing data is excluded and flagged, never counted as zero", () => {
  const rows: ConfigurationRow[] = [
    straight(100),
    // no source value for a 3/4" street elbow
    { id: "f1", kind: "fitting", fittingId: "elbow-90-street", size: "3/4", quantity: 4 },
  ];

  const result = calculateEquivalentLength(rows);

  assert.equal(result.missingDataRows.length, 1);
  assert.equal(result.rows[1].totalEquivalentLengthFt, null);
  assert.equal(result.rows[1].missingData, true);
  assert.equal(result.total.value, 100);
  assert.ok(result.total.warnings, "must warn that the total is an underestimate");
  assert.match(result.total.warnings![0], /underestimate/i);
});

test("EXV and hot-gas-bypass rows carry their range through", () => {
  const rows: ConfigurationRow[] = [
    straight(20),
    {
      id: "v1",
      kind: "valve-range",
      valveId: "hot-gas-bypass",
      connectionSize: '5/8" ODF',
      quantity: 1,
    },
  ];

  const result = calculateEquivalentLength(rows);
  // 18-30 ft, midpoint 24
  assert.equal(result.rows[1].eachEquivalentLengthFt, 24);
  assert.deepEqual(result.rows[1].rangeFt, { minFt: 18, maxFt: 30 });
  assert.equal(result.total.value, 44);
});

test("every calculation shows its work and cites a reference", () => {
  const result = calculateEquivalentLength([
    straight(80),
    { id: "f1", kind: "fitting", fittingId: "elbow-90-std", size: "1-1/8", quantity: 4 },
  ]);

  assert.ok(result.total.steps.length > 0);
  assert.ok(result.total.references.length > 0);
  assert.ok(result.multiplier.steps.length > 0);

  // the arithmetic must appear with real numbers substituted, not just symbols
  const sumStep = result.total.steps.find((s) => s.label === "Sum");
  assert.ok(sumStep?.substitution?.includes("80"));

  for (const row of result.rows) {
    assert.ok(row.steps.length > 0, `${row.name} shows no work`);
  }
});

test("an empty configuration is not an error and reports no multiplier", () => {
  const result = calculateEquivalentLength([]);
  assert.equal(result.total.value, 0);
  assert.equal(result.multiplier.value, null);
  assert.equal(result.assessments.multiplier.status, "unknown");
});

test("fittings with no straight pipe give no multiplier rather than a divide-by-zero", () => {
  const result = calculateEquivalentLength([
    { id: "f1", kind: "fitting", fittingId: "elbow-90-std", size: "1-1/8", quantity: 4 },
  ]);
  assert.equal(result.total.value, 10.8);
  assert.equal(result.multiplier.value, null);
  assert.ok(Number.isFinite(result.total.value));
});

test("status is three-state and carries reasoning plus a reference", () => {
  const ok = calculateEquivalentLength([
    straight(100),
    { id: "f", kind: "fitting", fittingId: "elbow-90-long-radius", size: "1-3/8", quantity: 4 },
  ]);
  assert.equal(ok.assessments.multiplier.status, "pass");

  // one globe valve on a short run pushes the multiplier past 2x
  const high = calculateEquivalentLength([
    straight(10),
    { id: "v", kind: "fitting", fittingId: "valve-globe-solenoid", size: "1-3/8", quantity: 1 },
  ]);
  assert.ok(["warning", "fail"].includes(high.assessments.multiplier.status));
  assert.ok(high.assessments.multiplier.reasoning.length > 0);
  assert.ok(high.assessments.multiplier.references.length > 0);
});

test("quantity scales a fitting linearly", () => {
  const one = evaluateRow({
    id: "a",
    kind: "fitting",
    fittingId: "elbow-90-std",
    size: "2-1/8",
    quantity: 1,
  });
  const seven = evaluateRow({
    id: "b",
    kind: "fitting",
    fittingId: "elbow-90-std",
    size: "2-1/8",
    quantity: 7,
  });
  assert.equal(one.contributionFt * 7, seven.contributionFt);
});
