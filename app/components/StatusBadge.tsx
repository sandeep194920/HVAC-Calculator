import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { Status } from "@/lib/types";

const STYLES: Record<
  Status,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  pass: {
    label: "PASS",
    className: "bg-pass-bg text-pass border-pass-border",
    Icon: CheckCircle2,
  },
  warning: {
    label: "WARNING",
    className: "bg-warn-bg text-warn border-warn-border",
    Icon: AlertTriangle,
  },
  fail: {
    label: "FAIL",
    className: "bg-fail-bg text-fail border-fail-border",
    Icon: XCircle,
  },
  unknown: {
    label: "NOT EVALUATED",
    className: "bg-unknown-bg text-unknown border-unknown-border",
    Icon: HelpCircle,
  },
};

/**
 * Three-state status, never a bare colour. The icon and the word both carry the
 * meaning so the badge still reads correctly without colour vision.
 */
export function StatusBadge({
  status,
  size = "md",
}: {
  status: Status;
  size?: "sm" | "md";
}) {
  const { label, className, Icon } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-semibold tracking-wide ${className} ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
    >
      <Icon size={size === "sm" ? 11 : 13} strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
}
