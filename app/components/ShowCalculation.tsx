"use client";

import { useState } from "react";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { CalculationStep, Reference } from "@/lib/types";
import { ReferenceList } from "./SourceBadge";

/**
 * "Show Calculation" (scope doc section 15, CLAUDE.md principle 1).
 *
 * Renders the structured steps the engine produced: formula, the named inputs
 * with their units, the arithmetic with real numbers substituted, the result,
 * and the references. The UI does no arithmetic of its own — if a number appears
 * here, the engine put it there.
 */
export function ShowCalculation({
  steps,
  references,
  warnings,
  label = "Show calculation",
  defaultOpen = false,
}: {
  steps: readonly CalculationStep[];
  references?: readonly Reference[];
  warnings?: readonly string[];
  label?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover"
      >
        <ChevronRight
          size={13}
          className={`transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden
        />
        {label}
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-border bg-code-bg p-3">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="text-xs leading-relaxed">
                <div className="font-semibold text-text">{step.label}</div>

                {step.formula && (
                  <div className="mono mt-1 text-text-muted">{step.formula}</div>
                )}

                {step.inputs && step.inputs.length > 0 && (
                  <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                    {step.inputs.map((input, j) => (
                      <div key={j} className="flex items-baseline gap-1">
                        <dt className="mono text-text-subtle">{input.name}</dt>
                        <dd className="mono tabular text-text">
                          = {typeof input.value === "number" ? input.value : input.value}
                          {input.unit ? ` ${input.unit}` : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {step.substitution && (
                  <div className="mono tabular mt-1 text-text">
                    {step.substitution}
                    {step.result !== undefined && (
                      <>
                        {" = "}
                        <span className="font-semibold">
                          {step.result}
                          {step.resultUnit ? ` ${step.resultUnit}` : ""}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {step.substitution === undefined && step.result !== undefined && (
                  <div className="mono tabular mt-1 font-semibold text-text">
                    {step.result}
                    {step.resultUnit ? ` ${step.resultUnit}` : ""}
                  </div>
                )}

                {step.note && (
                  <div className="mt-1 text-text-subtle italic">{step.note}</div>
                )}
              </li>
            ))}
          </ol>

          {warnings && warnings.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border pt-3">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-warn">
                  <AlertTriangle
                    size={13}
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {references && references.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-text-subtle uppercase">
                Source
              </div>
              <ReferenceList references={references} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
