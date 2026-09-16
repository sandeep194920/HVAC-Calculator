import { test } from "node:test";
import assert from "node:assert/strict";

import {
  saturationPressurePsia,
  humidityRatioFromWetBulb,
  wetBulbFromHumidityRatio,
  dewPointFromHumidityRatio,
  relativeHumidityFromHumidityRatio,
  enthalpyBtuPerLb,
  specificVolumeFt3PerLb,
  densityLbPerFt3,
  saturationHumidityRatio,
  validateDryWetBulb,
  calculatePsychrometrics,
  STANDARD_PRESSURE_PSIA,
} from "./psychrometrics.ts";

/**
 * The psychrometric engine is real physics, so it is tested against published
 * values rather than against itself. Anchors below come from ASHRAE Handbook —
 * Fundamentals Ch. 1 worked examples and its standard psychrometric tables.
 */

/* ---------- saturation pressure: the foundation everything else rests on ---------- */

test("saturation pressure matches ASHRAE table values", () => {
  // ASHRAE Fundamentals Ch. 1, Table 2 (thermodynamic properties of water at saturation)
  const cases: [tempF: number, expectedPsia: number][] = [
    [32, 0.0887],
    [50, 0.1780],
    [70, 0.3632],
    [80, 0.5073],
    [100, 0.9505],
    [120, 1.6945],
  ];

  for (const [tempF, expected] of cases) {
    const actual = saturationPressurePsia(tempF);
    const errorPct = Math.abs(actual - expected) / expected * 100;
    assert.ok(
      errorPct < 0.5,
      `p_ws(${tempF}°F) = ${actual.toFixed(5)}, expected ≈ ${expected} (off by ${errorPct.toFixed(2)}%)`,
    );
  }
});

test("saturation pressure switches correlation below freezing without a discontinuity", () => {
  // The ice and liquid correlations must agree closely at the 32°F boundary,
  // otherwise properties jump as air crosses freezing.
  const justBelow = saturationPressurePsia(31.999);
  const justAbove = saturationPressurePsia(32.001);
  assert.ok(
    Math.abs(justBelow - justAbove) < 1e-4,
    `discontinuity at 32°F: ${justBelow} vs ${justAbove}`,
  );
});

test("saturation pressure increases monotonically with temperature", () => {
  let previous = 0;
  for (let t = -100; t <= 300; t += 5) {
    const p = saturationPressurePsia(t);
    assert.ok(p > previous, `p_ws not increasing at ${t}°F`);
    previous = p;
  }
});

/* ---------- the standard AHRI rating point, 80°F DB / 67°F WB ---------- */

test("80°F DB / 67°F WB gives the published property set", () => {
  // This is the AHRI 210/240 and 340/360 indoor cooling rating condition, the
  // most-cited state in the whole domain. Values per ASHRAE psychrometric chart 1.
  const result = calculatePsychrometrics(80, 67);
  const s = result.value;
  assert.ok(s, "state should be valid");

  // Humidity ratio ≈ 0.0112 lb/lb
  assert.ok(
    Math.abs(s.humidityRatio - 0.0112) < 0.0004,
    `W = ${s.humidityRatio.toFixed(5)}, expected ≈ 0.0112`,
  );

  // RH ≈ 51%
  assert.ok(
    Math.abs(s.relativeHumidity * 100 - 51) < 2,
    `RH = ${(s.relativeHumidity * 100).toFixed(1)}%, expected ≈ 51%`,
  );

  // Enthalpy ≈ 31.4 Btu/lb
  assert.ok(
    Math.abs(s.enthalpyBtuPerLb - 31.4) < 0.6,
    `h = ${s.enthalpyBtuPerLb.toFixed(2)}, expected ≈ 31.4 Btu/lb`,
  );

  // Specific volume ≈ 13.85 ft³/lb
  assert.ok(
    Math.abs(s.specificVolumeFt3PerLb - 13.85) < 0.1,
    `v = ${s.specificVolumeFt3PerLb.toFixed(3)}, expected ≈ 13.85 ft³/lb`,
  );

  // Dew point ≈ 60.3°F
  assert.ok(
    Math.abs(s.dewPointF - 60.3) < 1.0,
    `t_dp = ${s.dewPointF.toFixed(2)}, expected ≈ 60.3°F`,
  );
});

test("standard air density is close to the familiar 0.075 lb/ft³", () => {
  // 70°F, 50% RH at sea level is the textbook "standard air" state.
  const w = 0.00778; // lb/lb at 70°F, ~50% RH
  const density = densityLbPerFt3(70, w);
  assert.ok(
    Math.abs(density - 0.075) < 0.002,
    `ρ = ${density.toFixed(5)}, expected ≈ 0.075 lb/ft³`,
  );
});

/* ---------- internal consistency: every inverse must round-trip ---------- */

test("wet-bulb and humidity ratio invert each other", () => {
  const cases: [db: number, wb: number][] = [
    [80, 67],
    [95, 75],
    [70, 60],
    [104, 78],
    [50, 45],
    [32, 30],
    [20, 18], // below freezing — exercises the other correlation
  ];

  for (const [db, wb] of cases) {
    const w = humidityRatioFromWetBulb(db, wb);
    const recovered = wetBulbFromHumidityRatio(db, w);
    assert.ok(
      Math.abs(recovered - wb) < 0.01,
      `${db}/${wb}: recovered wet-bulb ${recovered.toFixed(4)}, expected ${wb}`,
    );
  }
});

test("saturated air has equal dry-bulb, wet-bulb and dew point", () => {
  for (const t of [40, 60, 80, 100]) {
    const w = saturationHumidityRatio(t, STANDARD_PRESSURE_PSIA);
    const dewPoint = dewPointFromHumidityRatio(w);
    const rh = relativeHumidityFromHumidityRatio(t, w);

    assert.ok(
      Math.abs(dewPoint - t) < 0.5,
      `at saturation ${t}°F, dew point should equal dry-bulb, got ${dewPoint.toFixed(2)}`,
    );
    assert.ok(
      Math.abs(rh - 1) < 0.01,
      `at saturation ${t}°F, RH should be 100%, got ${(rh * 100).toFixed(1)}%`,
    );
  }
});

test("dew point never exceeds dry-bulb, and wet-bulb sits between them", () => {
  for (let db = 20; db <= 120; db += 10) {
    for (let depression = 0; depression <= 25; depression += 5) {
      const wb = db - depression;
      const w = humidityRatioFromWetBulb(db, wb);
      if (w <= 0) continue; // very dry air at large depressions

      const dp = dewPointFromHumidityRatio(w);
      assert.ok(dp <= db + 0.5, `dew point ${dp.toFixed(1)} > dry-bulb ${db}`);
      assert.ok(dp <= wb + 0.5, `dew point ${dp.toFixed(1)} > wet-bulb ${wb}`);
    }
  }
});

test("relative humidity stays within 0-100% across the working range", () => {
  for (let db = 20; db <= 120; db += 10) {
    for (let depression = 0; depression <= 20; depression += 5) {
      const wb = db - depression;
      const w = humidityRatioFromWetBulb(db, wb);
      if (w <= 0) continue;
      const rh = relativeHumidityFromHumidityRatio(db, w);
      assert.ok(
        rh >= 0 && rh <= 1.005,
        `RH out of range at ${db}/${wb}: ${(rh * 100).toFixed(1)}%`,
      );
    }
  }
});

test("enthalpy and specific volume rise with temperature and moisture", () => {
  assert.ok(enthalpyBtuPerLb(90, 0.01) > enthalpyBtuPerLb(80, 0.01));
  assert.ok(enthalpyBtuPerLb(80, 0.015) > enthalpyBtuPerLb(80, 0.01));
  assert.ok(specificVolumeFt3PerLb(90, 0.01) > specificVolumeFt3PerLb(80, 0.01));
  assert.ok(specificVolumeFt3PerLb(80, 0.015) > specificVolumeFt3PerLb(80, 0.01));
});

/* ---------- validation ---------- */

test("wet-bulb above dry-bulb is rejected, not calculated", () => {
  const v = validateDryWetBulb(80, 85);
  assert.equal(v.valid, false);
  assert.equal(v.field, "wetBulb");
  assert.match(v.message ?? "", /never exceed/i);

  // and the full calculation returns null rather than nonsense
  const result = calculatePsychrometrics(80, 85);
  assert.equal(result.value, null);
  assert.ok(result.warnings && result.warnings.length > 0);
});

test("equal dry-bulb and wet-bulb is valid — that is simply saturated air", () => {
  assert.equal(validateDryWetBulb(75, 75).valid, true);
  const result = calculatePsychrometrics(75, 75);
  assert.ok(result.value);
  assert.ok(Math.abs(result.value.relativeHumidity - 1) < 0.01);
});

test("temperatures outside the correlation range are rejected", () => {
  assert.equal(validateDryWetBulb(500, 400).valid, false);
  assert.equal(validateDryWetBulb(-200, -210).valid, false);
});

test("non-numeric input is rejected rather than producing NaN", () => {
  assert.equal(validateDryWetBulb(Number.NaN, 67).valid, false);
  assert.equal(calculatePsychrometrics(Number.NaN, 67).value, null);
});

/* ---------- transparency ---------- */

test("the calculation shows its work and cites ASHRAE", () => {
  const result = calculatePsychrometrics(80, 67);
  assert.ok(result.steps.length >= 7, "should show every intermediate property");
  assert.ok(result.references.length > 0);
  assert.match(result.references[0].title, /ASHRAE/);

  // every step that produces a number must name its formula or substitution
  for (const step of result.steps) {
    if (step.result !== undefined) {
      assert.ok(
        step.formula || step.substitution,
        `step "${step.label}" reports a result with no formula or substitution`,
      );
    }
  }
});

test("every property in the returned state is finite", () => {
  const result = calculatePsychrometrics(95, 75);
  const s = result.value;
  assert.ok(s);
  for (const [key, val] of Object.entries(s)) {
    assert.ok(Number.isFinite(val), `${key} is not finite: ${val}`);
  }
});
