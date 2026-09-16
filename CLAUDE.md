# HVAC Calculator

A refrigeration and HVAC engineering decision-support platform. Not a novelty
calculator.

Domain owner: Sanjeev (refrigeration engineer). He supplies the engineering
requirements, source data, and verification. Sandeep builds it.

## The product goal

Sanjeev today opens a dozen browser tabs to look up values, fills an Excel sheet
component by component, builds a summary, checks whether the numbers make sense,
and loops back to change inputs. **That loop is what this tool replaces.**

Three consequences, and they outrank everything else in this file:

1. **One page, and it supplies the values.** The engineer selects; they do not
   guess and they do not go hunting. Before adding a field that asks someone to
   type a number, ask whether the app could know it instead — from the standards
   database, from the location, or from an external API.
2. **Iteration speed is the product.** Not any single calculation. Favour one
   persistent project model with live recalculation over one-shot calculators.
3. **"Do these values make sense?" is the whole point.** The PASS / WARNING / FAIL
   engine is what closes his loop, so it outranks polish elsewhere.

## Two modules, one product

There are **two** scope documents from Sanjeev. Both are in scope.

| Module | Scope doc | Status |
|---|---|---|
| Refrigerant line sizing & equivalent length | `sources/line-sizing/scope-of-work.docx` (20 sections) | Phase 1 built |
| Entering air DB/WB condition selection | `sources/entering-air/scope-of-work.docx` (46 sections) | Next |

They share the units layer, the provenance schema, the transparency pattern and
the three-state status engine. Build them as modules of one app, not two apps.

Read the relevant scope doc before proposing scope. Each describes a finished
product, not a phase.

**Line sizing** targets something comparable to Sporlan Virtual Engineer, with one
capability Sporlan does not offer: a flexible **actual equivalent-length
calculator** where the engineer builds their real piping run — straight sections,
rises, drops, every fitting and valve — and gets a traceable total.

**Entering air DB/WB** guides the engineer from product type through operating
mode, location, climate and applicable standard to a sourced entering-air design
condition — so that, in Sanjeev's words, *"the person using the application should
not need to know the correct DB/WB values in advance."*

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

## Build order

**Done — line sizing, Phase 1.** Equivalent length calculator: the piping
configuration builder (line-sizing scope §16) with the fitting database behind it,
length unit support, and calculation transparency.

**Now — entering air DB/WB.** The guided selector, its relational standards
database, per-field °F/°C/K units, DB/WB validation, and the psychrometric engine
(RH, dew point, humidity ratio, enthalpy, specific volume, density). This is the
module that most directly serves the product goal, because it *supplies* values
the engineer would otherwise hunt for.

**Next — closing the loop on line sizing.** Pressure drop, velocity, oil return,
and the decision dashboard (line-sizing scope §11). Needs real refrigerant
properties, so CoolProp or an equivalent comes with it.

Deferred:

- **PDF / Excel / CSV export** — held for the paywall, not free tier. Sanjeev's
  own prototype has Word/PDF export; that does not change the business decision.
- Auto pipe-size recommendation
- Accounts, saved projects, backend. Note the DB/WB scope asks for an override
  audit trail with named users and revisions — that needs a backend, so it stays
  out until the requirement is confirmed as a real review process.

Automatic retrieval of standard conditions from an external API (DB/WB scope
"Method A") is not built. The internal database is "Method B", which that scope
defines as the required fallback. Never trust an unverified web result as a
standard value.

## Conventions

- No `any`. The engineering domain has real types; model them.
- Comments explain why, not what. The domain is unfamiliar enough that a short note
  on *why* a limit exists earns its place; a note restating the code does not.
- Unit-bearing values are named with their unit: `lengthFt`, `velocityFpm`,
  `pressureDropPsi`. A bare `length` is a bug waiting to happen.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
