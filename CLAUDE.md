# HVAC Calculator

A refrigeration piping design and line sizing calculator. Engineering decision-support
tool, not a novelty calculator.

Domain owner: Sanjeev (refrigeration engineer). He supplies the engineering
requirements, source data, and verification. Sandeep builds it.

## What this is

The target is a tool comparable to Sporlan Virtual Engineer, with one capability
Sporlan does not offer: a flexible **actual equivalent-length calculator** where the
engineer builds their real piping run — straight sections, rises, drops, every fitting
and valve — and gets a traceable total.

Full requirements are in `sources/line-sizing/scope-of-work.docx` (20 sections).
Read it before proposing scope. It describes the finished product, not Phase 1.

## Non-negotiable engineering principles

These come from the scope doc and are what separate this from the dozens of
throwaway line-sizing calculators online. Violating them makes the tool worthless
to its actual audience.

**1. Never a black box.** Every result must be expandable to show: formula, input
values, unit conversions, intermediate steps, final result, and the reference it
came from. If a number appears on screen with no way to see how it was derived,
that is a bug.

**2. Every data value carries a source.** Fitting equivalent lengths, velocity
limits, pressure-drop guidance — each needs a citation and a classification:

    Code requirement > Standard requirement > Manufacturer requirement > Engineering recommendation

These are not interchangeable and must never be rendered as though they were.
A velocity guideline from ASHRAE is not a code minimum, and the UI must not imply
it is.

**3. Limits are data, not constants.** Do not hard-code `if (velocity > 300)`.
Velocity and pressure-drop limits vary by refrigerant, line type, and operating
condition, and each is tied to a reference. They belong in the data layer with
their source attached, so they can be corrected without touching the engine.

**4. Units are first-class.** Every input and output supports multiple units
(ft/in/m/mm, psi/bar/kPa, °F/°C/K, ton/kW/Btu·h⁻¹, and so on). Store one canonical
unit internally, convert at the boundary. Unit confusion is the single most common
source of error in this domain — see the known bug below.

**5. Status is three-state, always.** PASS / WARNING / FAIL (green / yellow / red),
never a bare number. The engineer needs to know whether the value is acceptable,
needs review, or is not recommended — and why.

## Known bug in the source spreadsheet

`sources/line-sizing/equivalent-length-calculations.xlsx` has a unit error. Fitting
equivalent lengths on the "Source Data" sheet are in **feet** (1-3/8" 90° long-radius
elbow = 2.4 ft). The "Equivalent Length" sheet enters that same fitting as **28.8**,
which is 2.4 x 12 — inches. It then adds `Total Pipe Length` in feet, and converts
the sum with `CONVERT(...,"in","ft")`. The reported totals are roughly 12x too small.

Do not port this behavior. The calculator exists partly to make this class of error
impossible. Flag it to Sanjeev rather than silently "fixing" his numbers — he needs
to know which of his design documents used the bad figures.

Also: several `Size` cells read `46150` / `46089`. Excel coerced `1-1/8` and similar
into dates. Treat the Source Data sheet as authoritative for fitting values.

## Source data

| File | What it is | Trust level |
|---|---|---|
| `scope-of-work.docx` | Full requirements, 20 sections | Authoritative |
| `equivalent-length-calculations.xlsx` | Fitting equiv. lengths by size + worked examples | Source Data sheet good, calc sheet has the unit bug |
| `refrigerant-reference-table.xlsx` | ~75 refrigerants: family, category, blend, natural, legacy/current, application | Clean, publishable |
| `prototype.html` | Sanjeev's working HTML prototype | Direction, not implementation |

Do not delete these after porting. They are the provenance record.

## The prototype

`sources/line-sizing/prototype.html` shows the intended shape: system conditions on
the left, fittings table, calculated results and engineering guidance tabs on the right.
Take the layout intent and the guidance copy. Do not take the physics.

Its refrigerant property table is a hardcoded single-point approximation (one density
per refrigerant, one dP/dT slope) that is only valid near the specific evap/condensing
temperatures it was tuned for. Real properties vary continuously with saturation
temperature. The Reynolds number calculation also applies `32.174` inconsistently.
For anything beyond a demo, properties need to come from CoolProp (or an equivalent),
not a lookup of six numbers.

## Standards data and legal exposure

Fitting equivalent lengths and velocity guidance ultimately originate in copyrighted
standards (ASHRAE Handbook, AHRI, ISO, EN) and manufacturer literature. Before
anything goes behind a paywall:

- Every row needs a `verificationStatus` and a real citation with edition/year
- Sanjeev must verify each value against a licensed copy
- Manufacturer-specific data must be labeled separately from standardized data
- Unverified values must be visibly marked in the UI, not silently shipped

Build `source`, `sourceType`, `edition`, and `verificationStatus` into the data schema
from the first commit. Retrofitting provenance later is how this becomes a legal problem.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — `@import "tailwindcss"` in globals.css, `@tailwindcss/postcss` in postcss
- Lucide React for icons
- Deployed on Vercel (temporary domain for now)

Theme tokens use the three-state pattern: bare `:root` defines the full light palette;
`@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`
redefines tokens only; `:root[data-theme="dark"]` redefines them again so an explicit
toggle wins in both directions. Never define a color only inside a media or
`[data-theme]` block.

## Architecture

Keep the calculation engine free of React. Pure TypeScript functions in `lib/`, unit
tested, with the UI as a thin layer over them. Two reasons: the transparency
requirement means every calculation must be able to report its own steps, which is
much easier when the engine returns a structured result rather than a number; and a
paywalled backend later will need to run the same engine server-side.

A calculation returns its work, not just its answer:

```ts
type Calculation<T> = {
  value: T
  unit: string
  steps: CalculationStep[]   // formula, inputs, intermediates
  references: Reference[]
}
```

Data lives in `data/` as typed TypeScript, not JSON, so the source and verification
fields are type-enforced.

## Phase 1 scope

Equivalent length calculator only. The piping configuration builder (scope doc
section 16) with the fitting database behind it, full unit support, and calculation
transparency. This is the differentiator and it is self-contained.

Explicitly deferred:

- **PDF / Excel / CSV export** — held for the paywall, not free tier
- CoolProp integration and real refrigerant properties
- Auto pipe-size recommendation
- Oil return and part-load analysis
- Accounts, saved projects, backend

Do not build toward the deferred list. Build Phase 1 completely.

## Conventions

- No `any`. The engineering domain has real types; model them.
- Comments explain why, not what. The domain is unfamiliar enough that a short note
  on *why* a limit exists earns its place; a note restating the code does not.
- Unit-bearing values are named with their unit: `lengthFt`, `velocityFpm`,
  `pressureDropPsi`. A bare `length` is a bug waiting to happen.
