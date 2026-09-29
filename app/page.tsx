import Link from "next/link";
import {
  Calculator,
  BookOpen,
  Users,
  ArrowRight,
  Wind,
  Ruler,
  CircleDashed,
} from "lucide-react";

import { Masthead, SiteFooter, TAGLINE } from "./components/Brand";
import { ThemeToggle } from "./components/ThemeToggle";

/**
 * HVACRiQNet home page.
 *
 * Structure comes from Sanjeev's slide: three pillars — Apps, Knowledge,
 * Network — with the bullet lists he wrote. The look and feel is his
 * prototypes' (see `sources/entering-air/prototype-v2.html`): Public Sans on
 * paper, ink rules, teal accents, mono for anything machine-ish.
 *
 * HONESTY RULE FOR THIS PAGE: only tools that actually work are links. Anything
 * unbuilt is rendered as plainly unavailable, never as a link that 404s or a
 * button that does nothing. Sanjeev will show this to other engineers, and a
 * dead link in a demo costs more trust than an honest "in development" label.
 */

type Status = "live" | "in-development" | "planned";

type Item = {
  name: string;
  description: string;
  href?: string;
  status: Status;
  icon?: typeof Calculator;
};

type Pillar = {
  title: string;
  blurb: string;
  icon: typeof Calculator;
  items: Item[];
};

const PILLARS: Pillar[] = [
  {
    title: "Apps",
    blurb:
      "Transparent engineering calculations. Every result shows its formula, its inputs and the reference behind it.",
    icon: Calculator,
    items: [
      {
        name: "Equivalent length & line sizing",
        description:
          "Build the real piping run — straight sections, rises, drops, every fitting and valve — and get a traceable total.",
        href: "/tools/line-sizing",
        status: "live",
        icon: Ruler,
      },
      {
        name: "Entering air DB / WB selector",
        description:
          "Guided selection of the entering-air design condition by product, mode, location, climate and rating standard.",
        status: "in-development",
        icon: Wind,
      },
      {
        name: "Equipment selection",
        description: "Match equipment to the calculated duty and design conditions.",
        status: "planned",
      },
      {
        name: "System design & engineering validation",
        description:
          "Pressure drop, velocity and oil return checks across the whole system, with PASS / WARNING / FAIL guidance.",
        status: "planned",
      },
    ],
  },
  {
    title: "Knowledge",
    blurb:
      "The references behind every number, with the edition and verification status attached.",
    icon: BookOpen,
    items: [
      {
        name: "Codes & standards",
        description:
          "ASHRAE, AHRI, ISO and EN rating conditions, classified by authority so guidance is never shown as a requirement.",
        status: "planned",
      },
      {
        name: "Design guides & application notes",
        description: "Practical guidance tied to the calculations that use it.",
        status: "planned",
      },
      {
        name: "Technical articles",
        description: "Written by practising engineers.",
        status: "planned",
      },
      { name: "Training", description: "Structured learning paths.", status: "planned" },
    ],
  },
  {
    title: "Network",
    blurb:
      "The people side — engineers, contractors, manufacturers and suppliers, around real projects.",
    icon: Users,
    items: [
      {
        name: "Engineers & designers",
        description: "Professional profiles and project collaboration.",
        status: "planned",
      },
      {
        name: "Technicians & contractors",
        description: "Field expertise, connected to design intent.",
        status: "planned",
      },
      {
        name: "Manufacturers & suppliers",
        description: "Product data alongside the tools that size it.",
        status: "planned",
      },
      {
        name: "Technical discussions",
        description: "Problem-solving between practitioners.",
        status: "planned",
      },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen w-full">
      <Masthead>
        <ThemeToggle />
      </Masthead>

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero */}
        <section className="border-b border-border py-10 sm:py-14">
          <p className="mono mb-3 text-xs tracking-wide text-accent uppercase md:hidden">
            {TAGLINE}
          </p>
          <h1 className="max-w-3xl text-2xl leading-tight font-bold tracking-tight text-text sm:text-4xl">
            Engineering decisions you can trace back to the standard they came from.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
            HVACRiQNet brings refrigeration and HVAC design calculations, the
            references behind them, and the people who use them into one place — so
            the engineer selects values instead of hunting for them across a dozen
            browser tabs.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/tools/line-sizing"
              className="inline-flex items-center gap-2 rounded-md border border-text bg-text px-4 py-2.5 text-sm font-semibold text-bg no-underline transition-opacity hover:opacity-90"
            >
              Open the line sizing calculator
              <ArrowRight size={15} aria-hidden />
            </Link>
            <span className="mono text-xs text-text-subtle">
              Free · no sign-in · sources shown on every value
            </span>
          </div>
        </section>

        {/* Three pillars, in the order and wording of Sanjeev's slide */}
        <section className="grid gap-5 py-10 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.title} pillar={pillar} />
          ))}
        </section>

        {/* Provenance note — the differentiator, stated plainly */}
        <section className="mb-10 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">
            Why these tools can be checked
          </h2>
          <div className="mt-3 grid gap-4 text-xs leading-relaxed text-text-muted sm:grid-cols-3">
            <div>
              <div className="mb-1 font-semibold text-text">Never a black box</div>
              Every result expands to show the formula, the numbers that went into it,
              the unit conversions, and the source.
            </div>
            <div>
              <div className="mb-1 font-semibold text-text">Sourced data</div>
              Each value carries a citation classified as a code requirement, standard
              requirement, manufacturer requirement or engineering recommendation —
              never shown as interchangeable.
            </div>
            <div>
              <div className="mb-1 font-semibold text-text">Three-state guidance</div>
              Checks report PASS, WARNING or FAIL with the reasoning — not a bare
              number you have to interpret alone.
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function PillarCard({ pillar }: { pillar: Pillar }) {
  const PillarIcon = pillar.icon;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent">
          <PillarIcon size={17} strokeWidth={2} aria-hidden />
        </span>
        <h2 className="text-base font-semibold text-text">{pillar.title}</h2>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-text-muted">{pillar.blurb}</p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {pillar.items.map((item) => (
          <li key={item.name}>
            <ItemRow item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  const ItemIcon = item.icon ?? CircleDashed;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] leading-snug font-semibold">
          <ItemIcon
            size={13}
            strokeWidth={2}
            aria-hidden
            className={item.status === "live" ? "text-accent" : "text-text-subtle"}
          />
          {item.name}
        </span>
        <StatusPill status={item.status} />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.description}</p>
    </>
  );

  // Only live tools are links. Everything else is inert by design — see the
  // honesty rule at the top of this file.
  if (item.href && item.status === "live") {
    return (
      <Link
        href={item.href}
        className="block rounded-md border border-border bg-bg p-3 text-text no-underline transition-colors hover:border-accent"
      >
        {body}
      </Link>
    );
  }

  return <div className="block rounded-md border border-border p-3 opacity-80">{body}</div>;
}

const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
  live: { label: "LIVE", className: "bg-pass-bg text-pass border-pass-border" },
  "in-development": {
    label: "IN DEVELOPMENT",
    className: "bg-warn-bg text-warn border-warn-border",
  },
  planned: {
    label: "PLANNED",
    className: "bg-unknown-bg text-unknown border-unknown-border",
  },
};

function StatusPill({ status }: { status: Status }) {
  const { label, className } = STATUS_STYLE[status];
  return (
    <span
      className={`mono shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
