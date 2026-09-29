"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Info } from "lucide-react";

import {
  calculateEquivalentLength,
  nextRowId,
  type ConfigurationRow,
} from "@/lib/equivalent-length";
import type { LengthUnit } from "@/lib/units";
import type { NominalSize } from "@/data/fittings";
import { NOMINAL_SIZES } from "@/data/fittings";
import { LINE_TYPES, type LineType } from "@/data/limits";
import { refrigerantsForSelector, getRefrigerant } from "@/data/refrigerants";
import { KNOWN_SOURCE_ISSUES } from "@/lib/known-issues";

import { ConfigurationBuilder } from "@/app/components/ConfigurationBuilder";
import { ResultsPanel } from "@/app/components/ResultsPanel";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Masthead, SiteFooter } from "@/app/components/Brand";

/**
 * Phase 1: the equivalent-length calculator.
 *
 * Layout follows Sanjeev's prototype — system conditions and the piping table on
 * the left, results and guidance on the right.
 *
 * System conditions are captured but deliberately do not feed the arithmetic:
 * equivalent length depends on geometry, not on refrigerant or capacity. Pressure
 * drop and velocity are where those inputs matter, and they need real refrigerant
 * properties (CoolProp), which is explicitly out of Phase 1 scope. The panel says
 * so on screen rather than implying the numbers are in use.
 */

const DEFAULT_SIZE: NominalSize = "1-3/8";

/** A worked example: the run from the scope doc's section 16 table. */
function initialRows(): ConfigurationRow[] {
  return [
    {
      id: nextRowId("straight"),
      kind: "straight",
      straightKind: "horizontal",
      size: DEFAULT_SIZE,
      length: 80,
      lengthUnit: "ft",
      quantity: 1,
    },
    {
      id: nextRowId("fitting"),
      kind: "fitting",
      fittingId: "elbow-90-long-radius",
      size: DEFAULT_SIZE,
      quantity: 8,
    },
    {
      id: nextRowId("fitting"),
      kind: "fitting",
      fittingId: "valve-ball",
      size: DEFAULT_SIZE,
      quantity: 1,
    },
    {
      id: nextRowId("fitting"),
      kind: "fitting",
      fittingId: "device-filter-drier",
      size: DEFAULT_SIZE,
      quantity: 1,
    },
  ];
}

export default function Page() {
  const [rows, setRows] = useState<ConfigurationRow[]>(initialRows);
  const [outputUnit, setOutputUnit] = useState<LengthUnit>("ft");
  const [lineType, setLineType] = useState<LineType>("suction");
  const [refrigerant, setRefrigerant] = useState("R-454B");
  const [lineSize, setLineSize] = useState<NominalSize>(DEFAULT_SIZE);

  const result = useMemo(() => calculateEquivalentLength(rows), [rows]);
  const selectedRefrigerant = getRefrigerant(refrigerant);

  return (
    <div className="min-h-screen w-full">
      <Masthead>
        <ThemeToggle />
      </Masthead>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-5">
          <Link
            href="/"
            className="mono inline-flex items-center gap-1 text-xs text-text-subtle no-underline hover:text-accent"
          >
            <ArrowLeft size={12} aria-hidden />
            All tools
          </Link>
          <h1 className="mt-2 text-lg font-bold tracking-tight text-text">
            Refrigeration Equivalent Length Calculator
          </h1>
          <p className="text-xs text-text-muted">
            Build the actual piping run and get a traceable total. Every value shows
            its formula and its source.
          </p>
        </div>

        <UnverifiedDataBanner />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* LEFT: inputs. min-w-0 lets this grid track shrink below the
              configuration table's min-width, so the table scrolls inside its
              own container instead of widening the page. */}
          <div className="min-w-0 space-y-5">
            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-text">
                1. System Conditions
              </h2>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Refrigerant">
                  <select
                    value={refrigerant}
                    onChange={(e) => setRefrigerant(e.target.value)}
                    className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm"
                  >
                    {refrigerantsForSelector().map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.refrigerants.map((r) => (
                          <option key={r.designation} value={r.designation}>
                            {r.designation}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>

                <Field label="Line type">
                  <select
                    value={lineType}
                    onChange={(e) => setLineType(e.target.value as LineType)}
                    className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm"
                  >
                    {LINE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Line nominal size">
                  <select
                    value={lineSize}
                    onChange={(e) => setLineSize(e.target.value as NominalSize)}
                    className="w-full rounded border border-border bg-surface px-2 py-1.5 text-sm"
                  >
                    {NOMINAL_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}&quot;
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {selectedRefrigerant && (
                <p className="mt-2 text-xs text-text-muted">
                  {selectedRefrigerant.designation} — {selectedRefrigerant.chemicalFamily}
                  {", "}
                  {selectedRefrigerant.composition.toLowerCase()}
                  {selectedRefrigerant.natural ? ", natural" : ""} ·{" "}
                  {selectedRefrigerant.lifecycle} ·{" "}
                  {selectedRefrigerant.typicalApplication}
                </p>
              )}

              <div className="mt-3 flex items-start gap-2 rounded border border-border bg-surface-2 p-2.5 text-xs leading-relaxed text-text-muted">
                <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  Equivalent length is a function of piping geometry alone, so these
                  selections do not affect the result below. Refrigerant, line type and
                  capacity govern <em>pressure drop</em> and <em>velocity</em>, which
                  require real refrigerant properties and are not part of this phase.
                  They are captured here so the configuration records what the run is
                  for.
                </span>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-text">
                  2. Piping Configuration
                </h2>
                <span className="text-xs text-text-subtle">
                  {rows.length} row{rows.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mb-3 text-xs text-text-muted">
                Add every straight section, rise, drop, fitting and valve in the run.
                Each row can carry its own size, quantity and unit.
              </p>

              <ConfigurationBuilder
                rows={rows}
                contributions={result.rows}
                defaultSize={lineSize}
                onChange={setRows}
              />

              {result.missingDataRows.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded border border-warn-border bg-warn-bg p-2.5 text-xs leading-relaxed text-warn">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    <strong>
                      {result.missingDataRows.length} row
                      {result.missingDataRows.length === 1 ? " is" : "s are"} excluded
                      from the total.
                    </strong>{" "}
                    The source data has no equivalent length for that component at that
                    size. These rows are not counted as zero — the total below is an
                    underestimate until a manufacturer value is supplied.
                  </span>
                </div>
              )}
            </section>

            <SourceIssuesPanel />
          </div>

          {/* RIGHT: results */}
          <div className="min-w-0 lg:sticky lg:top-5 lg:self-start">
            <h2 className="mb-3 text-sm font-semibold text-text">
              3. Calculated Results
            </h2>
            <ResultsPanel
              result={result}
              outputUnit={outputUnit}
              onOutputUnitChange={setOutputUnit}
            />
          </div>
        </div>

        <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-text-subtle">
          This tool provides engineering guidance for refrigeration piping design. It
          does not replace a licensed engineer&apos;s judgment, applicable codes, or
          manufacturer specifications. Verify all results against the governing standard
          and equipment documentation before use in a real installation.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}

/** Unverified values must be visibly marked, not silently shipped. */
function UnverifiedDataBanner() {
  return (
    <div className="mb-5 flex items-start gap-2 rounded-lg border border-warn-border bg-warn-bg p-3 text-xs leading-relaxed text-warn">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden />
      <span>
        <strong>Fitting data is unverified.</strong> Every equivalent length in this tool
        was transcribed from a project worksheet and has not yet been checked against a
        licensed copy of the standard it derives from. Values are classified as
        engineering recommendations, not standard or code requirements. Confirm against
        the governing source before using these results on a real installation.
      </span>
    </div>
  );
}

function SourceIssuesPanel() {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-1 text-sm font-semibold text-text">Known source-data issues</h2>
      <p className="mb-3 text-xs text-text-muted">
        Problems found in the original spreadsheet, recorded rather than silently
        corrected — existing design documents may have used the affected figures.
      </p>

      <div className="space-y-2">
        {KNOWN_SOURCE_ISSUES.map((issue) => (
          <details
            key={issue.id}
            className="rounded border border-border bg-surface-2 px-3 py-2"
          >
            <summary className="cursor-pointer text-xs font-medium text-text">
              <span
                className={
                  issue.severity === "high"
                    ? "mr-1.5 font-semibold text-fail"
                    : "mr-1.5 font-semibold text-warn"
                }
              >
                {issue.severity === "high" ? "HIGH" : "MEDIUM"}
              </span>
              {issue.title}
            </summary>
            <div className="mt-2 space-y-2 text-xs leading-relaxed">
              <p className="mono text-[11px] text-text-subtle">{issue.location}</p>
              <p className="text-text-muted">{issue.description}</p>
              <p className="text-text">
                <strong className="font-semibold">In this tool:</strong>{" "}
                {issue.resolution}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
