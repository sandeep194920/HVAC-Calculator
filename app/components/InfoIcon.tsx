"use client";

import { useEffect, useRef, useState, useId } from "react";
import { Info, X } from "lucide-react";
import type { ParameterInfo } from "@/lib/types";
import { ReferenceList } from "./SourceBadge";

/**
 * ⓘ popover (scope doc section 12).
 *
 * Always renders the same five sections — meaning, why it matters, typical
 * range, too high, too low — plus the reference with its classification, so the
 * engineer learns one shape and can scan it everywhere.
 */
export function InfoIcon({ info }: { info: ParameterInfo }) {
  const [open, setOpen] = useState(false);
  // Right-align the panel when opening near the viewport edge would push it
  // off-screen — these icons sit in a right-hand results column.
  const [alignRight, setAlignRight] = useState(false);
  const [alignAbove, setAlignAbove] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number>();
  const containerRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const PANEL_WIDTH = 368; // matches w-[min(23rem,...)]
    const MARGIN = 16;
    const { left, top, bottom } = containerRef.current.getBoundingClientRect();

    setAlignRight(left + PANEL_WIDTH > window.innerWidth - MARGIN);

    // Open upward when the space below is cramped and there is more above.
    const spaceBelow = window.innerHeight - bottom - MARGIN;
    const spaceAbove = top - MARGIN;
    const above = spaceBelow < 280 && spaceAbove > spaceBelow;
    setAlignAbove(above);
    setMaxHeight(Math.max(200, above ? spaceAbove : spaceBelow));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`About ${info.parameter}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-text-subtle transition-colors hover:text-accent"
      >
        <Info size={14} strokeWidth={2.25} aria-hidden />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={info.parameter}
          className={`absolute z-50 w-[min(23rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-surface p-4 text-left ${
            alignRight ? "right-0" : "left-0"
          } ${alignAbove ? "bottom-6" : "top-6"}`}
          style={{
            boxShadow: "var(--shadow), 0 8px 24px rgb(0 0 0 / 0.12)",
            maxHeight: maxHeight ? `${maxHeight}px` : undefined,
          }}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold text-text">{info.parameter}</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mt-0.5 text-text-subtle hover:text-text"
            >
              <X size={14} aria-hidden />
            </button>
          </div>

          <dl className="space-y-2.5 text-xs leading-relaxed">
            <Section term="What it means" desc={info.whatItMeans} />
            <Section term="Why it matters" desc={info.whyItMatters} />
            <Section term="Typical range" desc={info.typicalRange} />
            <Section term="If too high" desc={info.ifTooHigh} />
            <Section term="If too low" desc={info.ifTooLow} />
          </dl>

          {info.references.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-text-subtle uppercase">
                Reference
              </div>
              <ReferenceList references={info.references} />
            </div>
          )}
        </div>
      )}
    </span>
  );
}

function Section({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <dt className="font-semibold text-text-muted">{term}</dt>
      <dd className="text-text">{desc}</dd>
    </div>
  );
}
