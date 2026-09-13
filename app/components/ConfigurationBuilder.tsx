"use client";

import { Plus, Trash2, Copy, AlertTriangle } from "lucide-react";
import {
  FITTINGS,
  NOMINAL_SIZES,
  VALVE_RANGES,
  availableSizes,
  fittingsByGroup,
  getFitting,
  type FittingId,
  type NominalSize,
} from "@/data/fittings";
import type {
  ConfigurationRow,
  RowContribution,
  StraightKind,
} from "@/lib/equivalent-length";
import { nextRowId } from "@/lib/equivalent-length";
import { LENGTH_UNITS, round, type LengthUnit } from "@/lib/units";
import { VerificationBadge } from "./SourceBadge";
import { ShowCalculation } from "./ShowCalculation";

/**
 * The piping configuration builder (scope doc section 16).
 *
 * An engineer builds the real run here: straight sections, rises, drops, and
 * every fitting and valve, each with its own size and quantity. Rows are added
 * and removed dynamically and the running total updates live.
 */

const STRAIGHT_KINDS: { id: StraightKind; label: string }[] = [
  { id: "horizontal", label: "Horizontal" },
  { id: "rise", label: "Vertical rise" },
  { id: "drop", label: "Vertical drop" },
];

export function ConfigurationBuilder({
  rows,
  contributions,
  defaultSize,
  onChange,
}: {
  rows: ConfigurationRow[];
  contributions: RowContribution[];
  defaultSize: NominalSize;
  onChange: (rows: ConfigurationRow[]) => void;
}) {
  const update = (id: string, patch: Partial<ConfigurationRow>) => {
    onChange(
      rows.map((r) => (r.id === id ? ({ ...r, ...patch } as ConfigurationRow) : r)),
    );
  };

  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));

  const duplicate = (id: string) => {
    const index = rows.findIndex((r) => r.id === id);
    if (index < 0) return;
    const copy = { ...rows[index], id: nextRowId(rows[index].kind) };
    onChange([...rows.slice(0, index + 1), copy, ...rows.slice(index + 1)]);
  };

  const addStraight = (straightKind: StraightKind) =>
    onChange([
      ...rows,
      {
        id: nextRowId("straight"),
        kind: "straight",
        straightKind,
        size: defaultSize,
        length: straightKind === "horizontal" ? 50 : 10,
        lengthUnit: "ft",
        quantity: 1,
      },
    ]);

  const addFitting = () => {
    const fittingId: FittingId = "elbow-90-long-radius";
    const sizes = availableSizes(fittingId);
    onChange([
      ...rows,
      {
        id: nextRowId("fitting"),
        kind: "fitting",
        fittingId,
        size: sizes.includes(defaultSize) ? defaultSize : sizes[0],
        quantity: 1,
      },
    ]);
  };

  const addValveRange = () =>
    onChange([
      ...rows,
      {
        id: nextRowId("valve"),
        kind: "valve-range",
        valveId: "exv",
        connectionSize: Object.keys(VALVE_RANGES[0].byConnectionSize)[0],
        quantity: 1,
      },
    ]);

  const byId = new Map(contributions.map((c) => [c.rowId, c]));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="w-[3%] py-2 pr-1 font-medium">#</th>
              <th className="w-[25%] py-2 pr-2 font-medium">Component</th>
              <th className="w-[12%] py-2 pr-2 font-medium">Size</th>
              <th className="w-[8%] py-2 pr-2 font-medium">Qty</th>
              <th className="w-[19%] py-2 pr-2 text-right font-medium">Actual length</th>
              <th className="w-[13%] py-2 pr-2 text-right font-medium">Equiv. length</th>
              <th className="w-[12%] py-2 pr-2 text-right font-medium">Total</th>
              <th className="w-[8%] py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-text-subtle">
                  No rows yet. Add the straight pipe sections and fittings that make up
                  your run.
                </td>
              </tr>
            )}

            {rows.map((row, index) => {
              const c = byId.get(row.id);
              return (
                <tr
                  key={row.id}
                  className="border-b border-border align-middle last:border-0"
                >
                  <td className="py-2 pr-2 text-xs text-text-subtle tabular">
                    {index + 1}
                  </td>

                  <td className="py-2 pr-2">
                    <ComponentCell row={row} onChange={(patch) => update(row.id, patch)} />
                  </td>

                  <td className="py-2 pr-2">
                    <SizeCell row={row} onChange={(patch) => update(row.id, patch)} />
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.quantity}
                      aria-label="Quantity"
                      onChange={(e) =>
                        update(row.id, {
                          quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                        })
                      }
                      className="tabular w-full rounded border border-border bg-surface px-2 py-1 text-sm"
                    />
                  </td>

                  <td className="py-2 pr-2 text-right">
                    {row.kind === "straight" ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={row.length}
                          aria-label="Length"
                          onChange={(e) =>
                            update(row.id, {
                              length: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="tabular w-20 rounded border border-border bg-surface px-2 py-1 text-right text-sm"
                        />
                        <select
                          value={row.lengthUnit}
                          aria-label="Length unit"
                          onChange={(e) =>
                            update(row.id, { lengthUnit: e.target.value as LengthUnit })
                          }
                          className="rounded border border-border bg-surface px-1 py-1 text-xs"
                        >
                          {LENGTH_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </td>

                  <td className="tabular py-2 pr-2 text-right text-sm">
                    {c?.missingData ? (
                      <span
                        className="inline-flex items-center gap-1 text-warn"
                        title="The source data has no value for this fitting at this size. The row is excluded from the total rather than counted as zero."
                      >
                        <AlertTriangle size={12} strokeWidth={2.5} aria-hidden />
                        no data
                      </span>
                    ) : c?.eachEquivalentLengthFt != null ? (
                      <>
                        {round(c.eachEquivalentLengthFt, 2)} ft
                        {c.rangeFt && (
                          <div className="text-[10px] text-text-subtle">
                            range {round(c.rangeFt.minFt / c.quantity, 1)}–
                            {round(c.rangeFt.maxFt / c.quantity, 1)} ft
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </td>

                  <td className="tabular py-2 pr-2 text-right text-sm font-medium">
                    {c?.missingData ? (
                      <span className="text-text-subtle">excluded</span>
                    ) : (
                      `${round(c?.contributionFt ?? 0, 2)} ft`
                    )}
                  </td>

                  <td className="py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => duplicate(row.id)}
                        aria-label={`Duplicate row ${index + 1}`}
                        title="Duplicate row"
                        className="rounded p-1 text-text-subtle hover:bg-surface-2 hover:text-text"
                      >
                        <Copy size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        aria-label={`Remove row ${index + 1}`}
                        title="Remove row"
                        className="rounded p-1 text-text-subtle hover:bg-fail-bg hover:text-fail"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Per-row shown work, so every line in the table can be traced. */}
      {contributions.length > 0 && (
        <details className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-accent">
            Show calculation for every row
          </summary>
          <div className="mt-2 space-y-3">
            {contributions.map((c, i) => (
              <div key={c.rowId}>
                <div className="flex items-center gap-2 text-xs font-semibold text-text">
                  <span className="text-text-subtle tabular">{i + 1}.</span>
                  {c.name}
                  <span className="font-normal text-text-subtle">{c.size}&quot;</span>
                  {c.verificationStatus !== "n/a" && (
                    <VerificationBadge
                      status={
                        c.verificationStatus as "verified" | "unverified" | "disputed"
                      }
                    />
                  )}
                </div>
                <ShowCalculation steps={c.steps} label="Show working" />
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {STRAIGHT_KINDS.map((k) => (
          <AddButton key={k.id} onClick={() => addStraight(k.id)}>
            {k.label} pipe
          </AddButton>
        ))}
        <AddButton onClick={addFitting}>Fitting / valve</AddButton>
        <AddButton onClick={addValveRange}>EXV / hot-gas bypass</AddButton>
      </div>
    </div>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent"
    >
      <Plus size={13} aria-hidden />
      {children}
    </button>
  );
}

function ComponentCell({
  row,
  onChange,
}: {
  row: ConfigurationRow;
  onChange: (patch: Partial<ConfigurationRow>) => void;
}) {
  if (row.kind === "straight") {
    return (
      <select
        value={row.straightKind}
        aria-label="Pipe section type"
        onChange={(e) => onChange({ straightKind: e.target.value as StraightKind })}
        className="w-full rounded border border-border bg-surface px-2 py-1 text-sm"
      >
        {STRAIGHT_KINDS.map((k) => (
          <option key={k.id} value={k.id}>
            Straight pipe — {k.label.toLowerCase()}
          </option>
        ))}
      </select>
    );
  }

  if (row.kind === "valve-range") {
    return (
      <select
        value={row.valveId}
        aria-label="Valve type"
        onChange={(e) =>
          onChange({ valveId: e.target.value as "exv" | "hot-gas-bypass" })
        }
        className="w-full rounded border border-border bg-surface px-2 py-1 text-sm"
      >
        {VALVE_RANGES.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      value={row.fittingId}
      aria-label="Fitting type"
      onChange={(e) => {
        const fittingId = e.target.value as FittingId;
        // Changing type can invalidate the size: not every fitting has data at
        // every size. Snap to a size this fitting actually has.
        const sizes = availableSizes(fittingId);
        const size = sizes.includes(row.size) ? row.size : sizes[0];
        onChange({ fittingId, size });
      }}
      className="w-full max-w-full min-w-0 rounded border border-border bg-surface px-2 py-1 text-sm"
    >
      {fittingsByGroup().map((group) => (
        <optgroup key={group.group} label={group.group}>
          {group.fittings.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function SizeCell({
  row,
  onChange,
}: {
  row: ConfigurationRow;
  onChange: (patch: Partial<ConfigurationRow>) => void;
}) {
  if (row.kind === "valve-range") {
    const valve = VALVE_RANGES.find((v) => v.id === row.valveId);
    return (
      <select
        value={row.connectionSize}
        aria-label="Connection size"
        onChange={(e) => onChange({ connectionSize: e.target.value })}
        className="w-full rounded border border-border bg-surface px-2 py-1 text-sm"
      >
        {Object.keys(valve?.byConnectionSize ?? {}).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }

  // For fittings, only offer sizes the source data actually covers. Offering a
  // size with no value would invite a row that silently contributes nothing.
  const sizes: readonly NominalSize[] =
    row.kind === "fitting" ? availableSizes(row.fittingId) : NOMINAL_SIZES;

  const unavailable =
    row.kind === "fitting"
      ? NOMINAL_SIZES.filter((s) => !sizes.includes(s))
      : ([] as NominalSize[]);

  return (
    <select
      value={row.size}
      aria-label="Nominal size"
      onChange={(e) => onChange({ size: e.target.value as NominalSize })}
      className="w-full rounded border border-border bg-surface px-2 py-1 text-sm"
    >
      {sizes.map((s) => (
        <option key={s} value={s}>
          {s}&quot;
        </option>
      ))}
      {unavailable.length > 0 && (
        <optgroup label="No source data at these sizes">
          {unavailable.map((s) => (
            <option key={s} value={s}>
              {s}&quot; — no data
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export { FITTINGS, getFitting };
