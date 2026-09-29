import Link from "next/link";

/**
 * The HVACRiQNet wordmark.
 *
 * Sanjeev's slide sets each letter in a different colour. Reproduced here as
 * per-letter spans rather than an image so it stays crisp at any size, respects
 * the theme, and can be read by screen readers as one word — the `aria-label`
 * on the wrapper carries the name, and the letters themselves are hidden from
 * the accessibility tree.
 */
const LETTERS: { char: string; className: string }[] = [
  { char: "H", className: "text-[#E03A3E]" },
  { char: "V", className: "text-[#F5A623]" },
  { char: "A", className: "text-[#2B9BD6]" },
  { char: "C", className: "text-[#1FA3A3]" },
  { char: "R", className: "text-[#3DA35D]" },
  { char: "i", className: "text-[#E8820C]" },
  { char: "Q", className: "text-[#C2408C]" },
  { char: "N", className: "text-[#2B5C8A]" },
  { char: "e", className: "text-[#7A4FB5]" },
  { char: "t", className: "text-[#0B6E68]" },
];

export function Wordmark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "text-4xl sm:text-5xl" : size === "sm" ? "text-lg" : "text-2xl";

  return (
    <span
      aria-label="HVACRiQNet"
      className={`inline-flex font-bold tracking-tight ${sizeClass} ${className}`}
    >
      {LETTERS.map((letter, i) => (
        <span key={i} aria-hidden className={letter.className}>
          {letter.char}
        </span>
      ))}
    </span>
  );
}

/** The tagline from Sanjeev's slide, used in the masthead. */
export const TAGLINE =
  "HVACR Virtual Engineering Tools | Intelligence | Professional Networking";

/**
 * Site masthead. Mirrors the prototypes: a two-line header separated from the
 * page by a heavy rule, with the wordmark left and the tagline right.
 */
export function Masthead({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b-2 border-text bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 no-underline">
          <Wordmark />
        </Link>
        <p className="hidden text-sm font-medium text-text-muted md:block">{TAGLINE}</p>
        {children}
      </div>
    </header>
  );
}

/**
 * Site footer, carried over verbatim from the prototypes — Sanjeev's
 * attribution line, which he has on every page he has shown.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 max-w-7xl px-4 pb-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-text pt-4 text-xs text-text-muted">
        <div className="font-bold text-text">Engineering Product Success</div>
        <div className="text-right">
          Engineered, Designed, and Developed in Collaboration with{" "}
          <b className="font-semibold text-text">Staar Solutions</b> and{" "}
          <b className="font-semibold text-text">Zenorbis Technologies</b>
        </div>
      </div>
    </footer>
  );
}
