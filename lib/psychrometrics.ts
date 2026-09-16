import type { Calculation, CalculationStep } from "./types";
import { collectReferences } from "@/data/references";
import { round } from "./units";

/**
 * Psychrometric engine.
 *
 * Implements the moist-air property relationships of ASHRAE Handbook —
 * Fundamentals, Ch. 1. Pure functions, no React, every public function returns
 * its work.
 *
 * Canonical units here are I-P (°F, psia, lb/lb, Btu/lb, ft³/lb) because the
 * ASHRAE correlations are published in that form and converting the constants
 * would obscure the provenance of each coefficient.
 *
 * WHY THIS EXISTS: the DB/WB scope requires RH, dew point, humidity ratio,
 * enthalpy, specific volume and density to be *calculated* from the DB/WB the
 * engineer selects, rather than looked up on a psychrometric chart in another
 * browser tab. This is the module's main piece of real physics.
 *
 * ACCURACY: the saturation-pressure correlation is ASHRAE's own and is accurate
 * to well within engineering tolerance over the range this tool covers
 * (-148 to 392 °F). The wet-bulb inversion is iterative; it converges to
 * 1e-6 lb/lb, far tighter than any input precision here.
 */

/** Standard atmospheric pressure at sea level, psia. */
export const STANDARD_PRESSURE_PSIA = 14.696;

/** Ratio of molecular masses, water vapour to dry air. Dimensionless. */
const MW_RATIO = 0.621945;

/**
 * Saturation vapour pressure over liquid water or ice, psia, for a given
 * dry-bulb temperature in °F.
 *
 * ASHRAE Fundamentals Ch. 1, Eq. 5 (over ice, below 32°F) and Eq. 6 (over
 * liquid water, at and above 32°F). The correlation is in absolute temperature,
 * so °F converts to °R first.
 */
export function saturationPressurePsia(tempF: number): number {
  const tR = tempF + 459.67; // °R
  const lnT = Math.log(tR);

  if (tempF < 32) {
    // Eq. 5 — over ice
    const lnP =
      -1.0214165e4 / tR -
      4.8932428 -
      5.3765794e-3 * tR +
      1.9202377e-7 * tR * tR +
      3.5575832e-10 * tR ** 3 -
      9.0344688e-14 * tR ** 4 +
      4.1635019 * lnT;
    return Math.exp(lnP);
  }

  // Eq. 6 — over liquid water
  const lnP =
    -1.0440397e4 / tR -
    1.129465e1 -
    2.7022355e-2 * tR +
    1.289036e-5 * tR * tR -
    2.4780681e-9 * tR ** 3 +
    6.5459673 * lnT;
  return Math.exp(lnP);
}

/** Humidity ratio from vapour pressure and total pressure, lb water / lb dry air. */
export function humidityRatioFromVaporPressure(
  vaporPressurePsia: number,
  pressurePsia: number,
): number {
  return (MW_RATIO * vaporPressurePsia) / (pressurePsia - vaporPressurePsia);
}

/** Vapour pressure from humidity ratio, psia. Inverse of the above. */
export function vaporPressureFromHumidityRatio(
  humidityRatio: number,
  pressurePsia: number,
): number {
  return (pressurePsia * humidityRatio) / (MW_RATIO + humidityRatio);
}

/**
 * Humidity ratio at saturation for a given temperature, lb/lb.
 * Used as the upper bound for any real air state at that temperature.
 */
export function saturationHumidityRatio(tempF: number, pressurePsia: number): number {
  return humidityRatioFromVaporPressure(saturationPressurePsia(tempF), pressurePsia);
}

/**
 * Humidity ratio from a dry-bulb / wet-bulb pair, lb/lb.
 *
 * ASHRAE Fundamentals Ch. 1, Eq. 33 (above freezing) and Eq. 34 (below), which
 * express W directly from the wet-bulb depression. No iteration needed in this
 * direction — the iteration is only required going the other way.
 */
export function humidityRatioFromWetBulb(
  dryBulbF: number,
  wetBulbF: number,
  pressurePsia: number = STANDARD_PRESSURE_PSIA,
): number {
  const wsStar = saturationHumidityRatio(wetBulbF, pressurePsia);

  if (wetBulbF >= 32) {
    // Eq. 33
    return (
      ((1093 - 0.556 * wetBulbF) * wsStar - 0.24 * (dryBulbF - wetBulbF)) /
      (1093 + 0.444 * dryBulbF - wetBulbF)
    );
  }

  // Eq. 34 — wet-bulb below freezing
  return (
    ((1220 - 0.04 * wetBulbF) * wsStar - 0.24 * (dryBulbF - wetBulbF)) /
    (1220 + 0.444 * dryBulbF - 0.48 * wetBulbF)
  );
}

/**
 * Wet-bulb temperature from dry-bulb and humidity ratio, °F.
 *
 * There is no closed form, so this brackets between a floor (dew point, the
 * lowest physically possible wet-bulb) and the dry-bulb, then bisects. Bisection
 * rather than Newton because the function is monotonic here and bisection cannot
 * diverge — robustness matters more than speed at these input sizes.
 */
export function wetBulbFromHumidityRatio(
  dryBulbF: number,
  humidityRatio: number,
  pressurePsia: number = STANDARD_PRESSURE_PSIA,
): number {
  let low = dewPointFromHumidityRatio(humidityRatio, pressurePsia);
  let high = dryBulbF;

  // Guard against dew point marginally exceeding dry bulb through rounding.
  if (low > high) low = high;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const w = humidityRatioFromWetBulb(dryBulbF, mid, pressurePsia);
    if (Math.abs(w - humidityRatio) < 1e-9) return mid;
    if (w > humidityRatio) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

/**
 * Dew-point temperature from humidity ratio, °F.
 *
 * ASHRAE Fundamentals Ch. 1, Eq. 37/38 — a direct correlation in the natural log
 * of vapour pressure, with separate coefficient sets above and below freezing.
 */
export function dewPointFromHumidityRatio(
  humidityRatio: number,
  pressurePsia: number = STANDARD_PRESSURE_PSIA,
): number {
  // Perfectly dry air has no dew point; clamp to a very low value rather than
  // returning -Infinity, so downstream arithmetic stays finite.
  if (humidityRatio <= 0) return -148;

  const pw = vaporPressureFromHumidityRatio(humidityRatio, pressurePsia);
  const alpha = Math.log(pw);

  // Eq. 37 — valid 32 to 200 °F
  const above =
    100.45 + 33.193 * alpha + 2.319 * alpha * alpha + 0.17074 * alpha ** 3 +
    1.2063 * Math.pow(pw, 0.1984);

  if (above >= 32) return above;

  // Eq. 38 — below 32 °F
  return 90.12 + 26.142 * alpha + 0.8927 * alpha * alpha;
}

/** Relative humidity (0–1) from humidity ratio. */
export function relativeHumidityFromHumidityRatio(
  dryBulbF: number,
  humidityRatio: number,
  pressurePsia: number = STANDARD_PRESSURE_PSIA,
): number {
  const pw = vaporPressureFromHumidityRatio(humidityRatio, pressurePsia);
  const pws = saturationPressurePsia(dryBulbF);
  return pws > 0 ? pw / pws : 0;
}

/**
 * Moist-air specific enthalpy, Btu per lb of DRY air.
 * ASHRAE Fundamentals Ch. 1, Eq. 30. Datum is 0°F for dry air, 32°F for water.
 */
export function enthalpyBtuPerLb(dryBulbF: number, humidityRatio: number): number {
  return 0.24 * dryBulbF + humidityRatio * (1061 + 0.444 * dryBulbF);
}

/**
 * Moist-air specific volume, ft³ per lb of dry air.
 * ASHRAE Fundamentals Ch. 1, Eq. 28.
 */
export function specificVolumeFt3PerLb(
  dryBulbF: number,
  humidityRatio: number,
  pressurePsia: number = STANDARD_PRESSURE_PSIA,
): number {
  const tR = dryBulbF + 459.67;
  return (0.370486 * tR * (1 + 1.607858 * humidityRatio)) / pressurePsia;
}

/**
 * Moist-air density, lb per ft³ of MOIST air.
 *
 * Note the denominator: specific volume is per pound of DRY air, so the moist
 * mass (1 + W) must be divided by it. Omitting the (1 + W) is a common error and
 * understates density by roughly the humidity ratio.
 */
export function densityLbPerFt3(
  dryBulbF: number,
  humidityRatio: number,
  pressurePsia: number = STANDARD_PRESSURE_PSIA,
): number {
  const v = specificVolumeFt3PerLb(dryBulbF, humidityRatio, pressurePsia);
  return (1 + humidityRatio) / v;
}

/* ---------- validation ---------- */

export type PsychrometricValidation = {
  valid: boolean;
  /** Present when invalid — plain-language, aimed at the engineer. */
  message?: string;
  /** Which input is at fault, for highlighting the right field. */
  field?: "dryBulb" | "wetBulb";
};

/**
 * Validate a DB/WB pair before calculating anything from it.
 *
 * The DB/WB scope calls this out specifically: wet-bulb above dry-bulb is
 * physically impossible at normal atmospheric conditions and almost always means
 * a unit mix-up (°C entered in a °F field). Catching it here stops a nonsense
 * number propagating into every downstream property.
 */
export function validateDryWetBulb(
  dryBulbF: number,
  wetBulbF: number,
): PsychrometricValidation {
  if (!Number.isFinite(dryBulbF) || !Number.isFinite(wetBulbF)) {
    return { valid: false, message: "Enter both a dry-bulb and a wet-bulb temperature." };
  }

  if (wetBulbF > dryBulbF) {
    return {
      valid: false,
      field: "wetBulb",
      message: `Wet-bulb (${round(wetBulbF, 1)}°F) is higher than dry-bulb (${round(dryBulbF, 1)}°F). Wet-bulb can never exceed dry-bulb — check the values and their units.`,
    };
  }

  // Outside the correlation's published range the numbers stop being meaningful.
  if (dryBulbF < -148 || dryBulbF > 392) {
    return {
      valid: false,
      field: "dryBulb",
      message: `Dry-bulb of ${round(dryBulbF, 1)}°F is outside the range these psychrometric correlations cover (-148 to 392°F).`,
    };
  }

  return { valid: true };
}

/* ---------- the full property set, with its work shown ---------- */

export type PsychrometricState = {
  dryBulbF: number;
  wetBulbF: number;
  pressurePsia: number;
  /** 0–1. Multiply by 100 for display. */
  relativeHumidity: number;
  dewPointF: number;
  /** lb water per lb dry air */
  humidityRatio: number;
  /** Btu per lb dry air */
  enthalpyBtuPerLb: number;
  /** ft³ per lb dry air */
  specificVolumeFt3PerLb: number;
  /** lb per ft³ moist air */
  densityLbPerFt3: number;
};

/**
 * Calculate every psychrometric property from a DB/WB pair, showing the work.
 *
 * Returns `null` for the value when validation fails, rather than throwing —
 * the UI needs to render the error alongside the inputs, not lose the page.
 */
export function calculatePsychrometrics(
  dryBulbF: number,
  wetBulbF: number,
  pressurePsia: number = STANDARD_PRESSURE_PSIA,
): Calculation<PsychrometricState | null> {
  const references = collectReferences(["ashrae-fundamentals-psychrometrics"]);
  const validation = validateDryWetBulb(dryBulbF, wetBulbF);

  if (!validation.valid) {
    return {
      value: null,
      unit: "",
      steps: [
        {
          label: "Validation",
          substitution: validation.message,
          note: "No properties were calculated — the entering condition is not physically valid.",
        },
      ],
      references,
      warnings: validation.message ? [validation.message] : undefined,
    };
  }

  const steps: CalculationStep[] = [];

  const pwsWetBulb = saturationPressurePsia(wetBulbF);
  steps.push({
    label: "Saturation pressure at wet-bulb",
    formula: "p_ws(t) — ASHRAE Fundamentals Ch. 1, Eq. 6",
    inputs: [{ name: "t_wb", value: round(wetBulbF, 2), unit: "°F" }],
    substitution: `p_ws(${round(wetBulbF, 2)}°F)`,
    result: round(pwsWetBulb, 5),
    resultUnit: "psia",
  });

  const wsStar = saturationHumidityRatio(wetBulbF, pressurePsia);
  steps.push({
    label: "Saturation humidity ratio at wet-bulb",
    formula: "W*_s = 0.621945 × p_ws / (p − p_ws)",
    inputs: [
      { name: "p_ws", value: round(pwsWetBulb, 5), unit: "psia" },
      { name: "p", value: round(pressurePsia, 4), unit: "psia" },
    ],
    substitution: `0.621945 × ${round(pwsWetBulb, 5)} / (${round(pressurePsia, 4)} − ${round(pwsWetBulb, 5)})`,
    result: round(wsStar, 6),
    resultUnit: "lb/lb",
  });

  const humidityRatio = humidityRatioFromWetBulb(dryBulbF, wetBulbF, pressurePsia);
  steps.push({
    label: "Humidity ratio",
    formula:
      wetBulbF >= 32
        ? "W = [(1093 − 0.556·t_wb)·W*_s − 0.24·(t_db − t_wb)] / (1093 + 0.444·t_db − t_wb)"
        : "W = [(1220 − 0.04·t_wb)·W*_s − 0.24·(t_db − t_wb)] / (1220 + 0.444·t_db − 0.48·t_wb)",
    inputs: [
      { name: "t_db", value: round(dryBulbF, 2), unit: "°F" },
      { name: "t_wb", value: round(wetBulbF, 2), unit: "°F" },
      { name: "W*_s", value: round(wsStar, 6), unit: "lb/lb" },
    ],
    result: round(humidityRatio, 6),
    resultUnit: "lb/lb",
    note:
      wetBulbF >= 32
        ? "ASHRAE Fundamentals Ch. 1, Eq. 33 (wet-bulb at or above freezing)."
        : "ASHRAE Fundamentals Ch. 1, Eq. 34 (wet-bulb below freezing).",
  });

  const rh = relativeHumidityFromHumidityRatio(dryBulbF, humidityRatio, pressurePsia);
  steps.push({
    label: "Relative humidity",
    formula: "φ = p_w / p_ws(t_db)",
    inputs: [
      { name: "W", value: round(humidityRatio, 6), unit: "lb/lb" },
      { name: "t_db", value: round(dryBulbF, 2), unit: "°F" },
    ],
    result: round(rh * 100, 1),
    resultUnit: "%",
  });

  const dewPointF = dewPointFromHumidityRatio(humidityRatio, pressurePsia);
  steps.push({
    label: "Dew point",
    formula: "t_dp = f(ln p_w) — ASHRAE Fundamentals Ch. 1, Eq. 37/38",
    inputs: [{ name: "W", value: round(humidityRatio, 6), unit: "lb/lb" }],
    result: round(dewPointF, 2),
    resultUnit: "°F",
    note: "The temperature at which this air would begin to condense. Coil surfaces below it will wet.",
  });

  const enthalpy = enthalpyBtuPerLb(dryBulbF, humidityRatio);
  steps.push({
    label: "Enthalpy",
    formula: "h = 0.24·t_db + W·(1061 + 0.444·t_db)",
    inputs: [
      { name: "t_db", value: round(dryBulbF, 2), unit: "°F" },
      { name: "W", value: round(humidityRatio, 6), unit: "lb/lb" },
    ],
    substitution: `0.24 × ${round(dryBulbF, 2)} + ${round(humidityRatio, 6)} × (1061 + 0.444 × ${round(dryBulbF, 2)})`,
    result: round(enthalpy, 3),
    resultUnit: "Btu/lb",
    note: "Per pound of dry air. Total cooling load is computed from the enthalpy difference across the coil.",
  });

  const specificVolume = specificVolumeFt3PerLb(dryBulbF, humidityRatio, pressurePsia);
  steps.push({
    label: "Specific volume",
    formula: "v = 0.370486·(t_db + 459.67)·(1 + 1.607858·W) / p",
    inputs: [
      { name: "t_db", value: round(dryBulbF, 2), unit: "°F" },
      { name: "W", value: round(humidityRatio, 6), unit: "lb/lb" },
      { name: "p", value: round(pressurePsia, 4), unit: "psia" },
    ],
    result: round(specificVolume, 4),
    resultUnit: "ft³/lb",
  });

  const density = densityLbPerFt3(dryBulbF, humidityRatio, pressurePsia);
  steps.push({
    label: "Density",
    formula: "ρ = (1 + W) / v",
    inputs: [
      { name: "W", value: round(humidityRatio, 6), unit: "lb/lb" },
      { name: "v", value: round(specificVolume, 4), unit: "ft³/lb" },
    ],
    substitution: `(1 + ${round(humidityRatio, 6)}) / ${round(specificVolume, 4)}`,
    result: round(density, 5),
    resultUnit: "lb/ft³",
    note: "Moist-air density. Specific volume is per pound of DRY air, so the (1 + W) converts it to a moist-air basis.",
  });

  return {
    value: {
      dryBulbF,
      wetBulbF,
      pressurePsia,
      relativeHumidity: rh,
      dewPointF,
      humidityRatio,
      enthalpyBtuPerLb: enthalpy,
      specificVolumeFt3PerLb: specificVolume,
      densityLbPerFt3: density,
    },
    unit: "",
    steps,
    references,
  };
}
