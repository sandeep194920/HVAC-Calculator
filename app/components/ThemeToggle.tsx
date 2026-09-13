"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

const OPTIONS: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

/**
 * The authoritative theme lives on <html data-theme>, written before first paint
 * by the inline script in layout.tsx. That makes it external state, so the
 * control subscribes to it rather than keeping a second copy in React — which
 * would start out wrong on the first client render and need an effect to correct.
 */
const themeStore = {
  subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  },
  getSnapshot(): Theme {
    const stored = document.documentElement.getAttribute("data-theme");
    return stored === "dark" || stored === "light" ? stored : "system";
  },
  // The server cannot know the viewer's choice; "system" matches what the
  // un-attributed <html> renders as.
  getServerSnapshot(): Theme {
    return "system";
  },
};

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  const apply = useCallback((next: Theme) => {
    // Apply first, persist second: if storage is blocked the theme must still
    // change for this session.
    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }

    try {
      if (next === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", next);
      }
    } catch {
      // Private browsing can block storage; the choice just won't persist.
    }
  }, []);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex rounded-md border border-border bg-surface p-0.5"
    >
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => apply(id)}
          aria-pressed={theme === id}
          title={label}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
            theme === id
              ? "bg-accent-soft text-accent"
              : "text-text-subtle hover:text-text"
          }`}
        >
          <Icon size={13} aria-hidden />
          <span className="sr-only sm:not-sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
