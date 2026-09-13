import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { FITTINGS, NOMINAL_SIZES, type FittingId, type NominalSize } from "./fittings.ts";

/**
 * Transcription check.
 *
 * `__fixtures__/source-data-sheet.json` was extracted mechanically from the
 * "Source Data" sheet of the XLSX — cell by cell, dashes preserved as null. This
 * test asserts the hand-written TypeScript table matches it exactly, so a typo in
 * a 360-value transcription fails the build instead of quietly shipping a wrong
 * equivalent length.
 *
 * Regenerate the fixture only from the spreadsheet, never from the TypeScript.
 */

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "source-data-sheet.json",
);

const sourceSheet: Record<string, (number | null)[]> = JSON.parse(
  readFileSync(fixturePath, "utf8"),
);

test("fixture covers every fitting in the database, and vice versa", () => {
  const inCode = new Set(FITTINGS.map((f) => f.id));
  const inSheet = new Set(Object.keys(sourceSheet));

  for (const id of inCode) {
    assert.ok(inSheet.has(id), `${id} is in the code but not in the source sheet fixture`);
  }
  for (const id of inSheet) {
    assert.ok(
      inCode.has(id as FittingId),
      `${id} is in the source sheet fixture but not in the code`,
    );
  }
});

test("every transcribed value matches the Source Data sheet cell for cell", () => {
  for (const fitting of FITTINGS) {
    const expected = sourceSheet[fitting.id];
    assert.ok(expected, `no fixture row for ${fitting.id}`);
    assert.equal(
      expected.length,
      NOMINAL_SIZES.length,
      `fixture row ${fitting.id} has the wrong number of columns`,
    );

    NOMINAL_SIZES.forEach((size: NominalSize, i: number) => {
      const actual = fitting.equivalentLengthFt[size] ?? null;
      assert.equal(
        actual,
        expected[i],
        `${fitting.id} at ${size}": code has ${actual}, source sheet has ${expected[i]}`,
      );
    });
  }
});

test("dashes stayed null and never became zero anywhere in the table", () => {
  for (const fitting of FITTINGS) {
    const expected = sourceSheet[fitting.id];
    NOMINAL_SIZES.forEach((size: NominalSize, i: number) => {
      if (expected[i] === null) {
        const actual = fitting.equivalentLengthFt[size] ?? null;
        assert.equal(
          actual,
          null,
          `${fitting.id} at ${size}" is absent in the source but present in code`,
        );
        assert.notEqual(actual, 0, `${fitting.id} at ${size}" was coerced to zero`);
      }
    });
  }
});
