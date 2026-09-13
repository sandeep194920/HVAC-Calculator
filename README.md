# HVAC Calculator

Refrigeration piping design and line sizing calculator — an engineering
decision-support tool for sizing suction, discharge, and liquid lines.

## Why

Existing online line-sizing calculators ask for a pipe length and hand back a number.
Real refrigeration piping is a run of straight sections, rises, drops, elbows, tees,
valves, filter-driers and sight glasses, and the *equivalent* length of all of that is
what actually determines pressure drop. Getting it wrong costs capacity, efficiency,
or a compressor.

This tool lets an engineer build their actual piping configuration and get a
traceable total — with every value showing its formula, its inputs, and the
engineering reference behind it.

## Principles

- **Not a black box.** Every result expands to show the formula, the numbers that
  went into it, the unit conversions, and the source.
- **Sourced data.** Each fitting value and each limit carries a citation and is
  classified as a code requirement, standard requirement, manufacturer requirement,
  or engineering recommendation. These are not the same thing and are never shown
  as though they were.
- **Real units.** Multi-unit input and output throughout. Unit confusion is the most
  common error in this domain.
- **Three-state guidance.** Every check reports PASS, WARNING, or FAIL with the
  reasoning, not a bare number.

## Status

Phase 1 is built: the equivalent-length calculator and piping configuration builder.

Working today:

- **Piping configuration builder** — add straight sections, vertical rises and drops,
  and any fitting or valve by type and size; rows are added, duplicated and removed
  dynamically, and the total updates live.
- **Breakdown** — actual pipe length, fitting equivalent length, valve/component
  equivalent length, vertical piping, total, and the equivalent-length multiplier.
- **Show Calculation** on every result and every row — formula, inputs, unit
  conversion, substituted arithmetic, result, and source.
- **ⓘ on every result** — what it means, why it matters, typical range, what happens
  if it is too high or too low, and the reference with its classification.
- **Multi-unit input and output** — ft / in / m / mm per row, converted once on entry.
- **Fitting database** — 24 fitting, valve and device types across 15 nominal sizes
  (1/2" to 8-1/8"), plus EXV and hot-gas-bypass ranges. Every row carries its source,
  classification and verification status.

Not built, by design (see `CLAUDE.md`): export, CoolProp properties, automatic pipe-size
recommendation, oil-return analysis, accounts.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Deployed on Vercel

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine + data transcription tests
npm run typecheck
npm run lint
```

## Repository layout

```
app/            Next.js App Router pages and UI components
lib/            Calculation engine — pure TypeScript, no React
  units.ts            unit conversion; canonical units are ft / in / psi / °F
  equivalent-length.ts the engine; returns steps and references, not bare numbers
  types.ts            Calculation<T>, Sourced<T>, Reference, Status
data/           Typed databases, each value carrying its provenance
  fittings.ts         equivalent lengths in FEET; missing entries are null, never 0
  refrigerants.ts     73 refrigerants, classification only
  references.ts       citations with edition and classification
  limits.ts           design limits as data, not constants
sources/        Original engineering source documents (provenance — do not delete)
```

## A note on the source data

The fitting values come from the "Source Data" sheet of
`sources/line-sizing/equivalent-length-calculations.xlsx` and are **in feet**. That
workbook's separate "Equivalent Length" sheet contains a feet/inches unit error that
makes its worked totals roughly 12x too small; that arithmetic is deliberately not
reproduced. The error, and two smaller source issues, are documented in
`lib/known-issues.ts` and shown in the app rather than silently corrected — existing
design documents may have used the affected figures.

`data/fittings.test.ts` checks all 360 transcribed values against a fixture extracted
cell-by-cell from the spreadsheet, so a transcription typo fails the build.

All fitting data is currently marked `unverified` and is labelled as such in the UI.
It needs checking against licensed copies of the originating standards before it can be
presented as anything stronger than an engineering recommendation.

## Engineering source material

`sources/` holds the original scope of work, fitting-length spreadsheets, refrigerant
reference table, and the HTML prototype these were derived from. They are kept as the
provenance record for every value in the database.

## Disclaimer

This tool provides engineering guidance for refrigeration piping design. It does not
replace a licensed engineer's judgment, applicable codes, or manufacturer
specifications. Verify all results against the governing standard and equipment
documentation before use in a real installation.
