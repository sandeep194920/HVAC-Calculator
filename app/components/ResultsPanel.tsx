"use client";

import type { EquivalentLengthResult } from "@/lib/equivalent-length";
import { lengthFromFt, round, unitLabel, type LengthUnit } from "@/lib/units";
import { PARAMETER_INFO, type InfoKey } from "@/data/parameter-info";
import { InfoIcon } from "./InfoIcon";
import { StatusBadge } from "./StatusBadge";
import { ShowCalculation } from "./ShowCalculation";
import { ReferenceList } from "./SourceBadge";

/**
 * Results, broken down the way scope doc section 5 requires: actual pipe length,
 * fitting equivalent length, valve/component equivalent length, vertical piping,
 * total, and multiplier — each with its own ⓘ and its own shown work.
 */
export function ResultsPanel({
  result,
  outputUnit,
  onOutputUnitChange,
}: {
  result: EquivalentLengthResult;
  outputUnit: LengthUnit;
  onOutputUnitChange: (unit: LengthUnit) => void;
}) {
  const { breakdown, total, multiplier, assessments } = result;

  const fmt = (ft: number, decimals = 1) =>
    `${round(lengthFromFt(ft, outputUnit), decimals)} ${unitLabel(outputUnit)}`;

  return (
    <div className="space-y-4">
      {/* Headline */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-text">Total Equivalent Length</h3>
            <InfoIcon info={PARAMETER_INFO["total-equivalent-length"]} />
          </div>
          <StatusBadge status={assessments.totalEquivalentLength.status} />
        </div>

        <div className="tabular mt-2 text-3xl font-semibold text-text">
          {fmt(breakdown.totalEquivalentLengthFt, 1)}
        </div>
        <div className="tabular mt-0.5 text-xs text-text-muted">
          {(["ft", "m", "in", "mm"] as LengthUnit[])
            .filter((u) => u !== outputUnit)
            .map(
              (u) =>
                `${round(lengthFromFt(breakdown.totalEquivalentLengthFt, u), u === "mm" || u === "in" ? 0 : 2)} ${unitLabel(u)}`,
            )
            .join("  ·  ")}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          {assessments.totalEquivalentLength.reasoning}
        </p>

        <ShowCalculation
          steps={total.steps}
          references={total.references}
          warnings={total.warnings}
          label="Show calculation"
        />
      </section>

      {/* Breakdown — section 5 */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-text">Breakdown</h3>
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            Display in
            <select
              value={outputUnit}
              onChange={(e) => onOutputUnitChange(e.target.value as LengthUnit)}
              aria-label="Output unit"
              className="rounded border border-border bg-surface px-1.5 py-1 text-xs"
            >
              {(["ft", "in", "m", "mm"] as LengthUnit[]).map((u) => (
                <option key={u} value={u}>
                  {unitLabel(u)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <dl className="divide-y divide-border">
          <BreakdownRow
            infoKey="actual-pipe-length"
            label="Actual pipe length (horizontal)"
            value={fmt(breakdown.actualPipeLengthFt)}
          />
          <BreakdownRow
            infoKey="vertical-piping"
            label="Vertical piping"
            value={fmt(breakdown.verticalPipingFt)}
            detail={
              breakdown.verticalPipingFt > 0
                ? `rise ${fmt(breakdown.verticalRiseFt)} · drop ${fmt(breakdown.verticalDropFt)}`
                : undefined
            }
          />
          <BreakdownRow
            infoKey="fitting-equivalent-length"
            label="Fitting equivalent length"
            value={fmt(breakdown.fittingEquivalentLengthFt)}
            detail="elbows, tees, couplings"
          />
          <BreakdownRow
            infoKey="component-equivalent-length"
            label="Valve & component equivalent length"
            value={fmt(breakdown.componentEquivalentLengthFt)}
            detail="valves, driers, sight glasses, EXV/HGBV"
          />

          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-sm font-semibold text-text">Total equivalent length</dt>
            <dd className="tabular text-sm font-semibold text-text">
              {fmt(breakdown.totalEquivalentLengthFt)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Multiplier */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-text">
              Equivalent Length Multiplier
            </h3>
            <InfoIcon info={PARAMETER_INFO["equivalent-length-multiplier"]} />
          </div>
          <StatusBadge status={assessments.multiplier.status} />
        </div>

        <div className="tabular mt-2 text-2xl font-semibold text-text">
          {multiplier.value === null ? "—" : `${multiplier.value.toFixed(2)}x`}
        </div>
        <div className="mt-0.5 text-xs text-text-muted">
          {multiplier.value === null
            ? "Add a straight-pipe section to calculate."
            : `The run behaves as ${multiplier.value.toFixed(2)}x its measured length of ${fmt(breakdown.totalActualLengthFt)}.`}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          {assessments.multiplier.reasoning}
        </p>

        <ShowCalculation
          steps={multiplier.steps}
          references={multiplier.references}
          label="Show calculation"
        />
      </section>

      {/* References used */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-text">References</h3>
        <ReferenceList references={total.references} />
        <p className="mt-3 text-[11px] leading-relaxed text-text-subtle">
          Classification order: code requirement &gt; standard requirement &gt;
          manufacturer requirement &gt; engineering recommendation. These are not
          interchangeable — a recommendation is guidance, not a requirement.
        </p>
      </section>
    </div>
  );
}

function BreakdownRow({
  infoKey,
  label,
  value,
  detail,
}: {
  infoKey: InfoKey;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-sm text-text">
        <span>{label}</span>
        <InfoIcon info={PARAMETER_INFO[infoKey]} />
        {detail && (
          <span className="hidden text-xs text-text-subtle sm:inline">({detail})</span>
        )}
      </dt>
      <dd className="tabular shrink-0 text-sm text-text">{value}</dd>
    </div>
  );
}
