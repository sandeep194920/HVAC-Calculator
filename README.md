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

Early. Phase 1 is the equivalent-length calculator and piping configuration builder.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

## Repository layout

```
app/            Next.js App Router pages
lib/            Calculation engine — pure TypeScript, no React
data/           Fitting, refrigerant, and reference databases (typed)
sources/        Original engineering source documents (provenance — do not delete)
```

## Engineering source material

`sources/` holds the original scope of work, fitting-length spreadsheets, refrigerant
reference table, and the HTML prototype these were derived from. They are kept as the
provenance record for every value in the database.

## Disclaimer

This tool provides engineering guidance for refrigeration piping design. It does not
replace a licensed engineer's judgment, applicable codes, or manufacturer
specifications. Verify all results against the governing standard and equipment
documentation before use in a real installation.
