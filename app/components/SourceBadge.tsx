import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { SourceType, VerificationStatus, Reference } from "@/lib/types";
import { SOURCE_TYPE_LABEL } from "@/lib/types";

/**
 * Renders a value's authority classification.
 *
 * The ordering — code > standard > manufacturer > recommendation — is the whole
 * point: these must look different from each other, so an ASHRAE recommendation
 * is never mistaken for a code minimum. The styling is deliberately graded, with
 * the weakest classification the least emphatic.
 */
const SOURCE_TYPE_STYLE: Record<SourceType, string> = {
  code: "bg-fail-bg text-fail border-fail-border",
  standard: "bg-accent-soft text-accent border-accent/30",
  manufacturer: "bg-surface-3 text-text-muted border-border-strong",
  recommendation: "bg-surface-2 text-text-subtle border-border",
  "user-defined": "bg-surface-2 text-text-subtle border-border border-dashed",
};

export function SourceTypeBadge({ sourceType }: { sourceType: SourceType }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${SOURCE_TYPE_STYLE[sourceType]}`}
      title="Authority classification: code > standard > manufacturer > engineering recommendation. These are not interchangeable."
    >
      {SOURCE_TYPE_LABEL[sourceType]}
    </span>
  );
}

const VERIFICATION_STYLE: Record<
  VerificationStatus,
  { label: string; className: string; Icon: typeof ShieldCheck; title: string }
> = {
  verified: {
    label: "Verified",
    className: "text-pass",
    Icon: ShieldCheck,
    title: "Checked against a licensed copy of the cited source.",
  },
  unverified: {
    label: "Unverified",
    className: "text-warn",
    Icon: ShieldQuestion,
    title:
      "Not yet checked against a licensed copy of the source standard. Confirm before relying on this value for a real installation.",
  },
  disputed: {
    label: "Disputed",
    className: "text-fail",
    Icon: ShieldAlert,
    title: "This value is known to conflict with another source.",
  },
};

/** Unverified data must be visibly marked, never shipped silently. */
export function VerificationBadge({
  status,
  showLabel = true,
}: {
  status: VerificationStatus;
  showLabel?: boolean;
}) {
  const { label, className, Icon, title } = VERIFICATION_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium ${className}`}
      title={title}
    >
      <Icon size={11} strokeWidth={2.5} aria-hidden />
      {showLabel && label}
    </span>
  );
}

export function ReferenceList({ references }: { references: readonly Reference[] }) {
  if (references.length === 0) return null;
  return (
    <ul className="space-y-2">
      {references.map((ref) => (
        <li key={ref.id} className="text-xs leading-relaxed">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-text">{ref.title}</span>
            <span className="text-text-subtle">({ref.edition})</span>
            <SourceTypeBadge sourceType={ref.sourceType} />
          </div>
          {ref.locator && <div className="text-text-muted">{ref.locator}</div>}
          {ref.notes && <div className="mt-0.5 text-text-subtle italic">{ref.notes}</div>}
        </li>
      ))}
    </ul>
  );
}
