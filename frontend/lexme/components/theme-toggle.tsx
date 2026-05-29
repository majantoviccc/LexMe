"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme, type Theme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

// false during SSR + first client render, true after hydration — avoids
// theme-dependent attribute mismatches without setState-in-effect.
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Svijetla", Icon: Sun },
  { value: "dark", label: "Tamna", Icon: Moon },
  { value: "system", label: "Sistemska", Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-sidebar-hover p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = hydrated && theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full cursor-pointer transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3 w-3" />
          </button>
        );
      })}
    </div>
  );
}
