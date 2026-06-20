"use client";

/**
 * Light/dark theme toggle (next-themes). Dark is the default; this flips the
 * `class` on <html>, which swaps the token palette in globals.css.
 *
 * @module components/app/theme-toggle
 */
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration mismatch — render the icon only after mount.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle light/dark theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
      className="w-8 h-8 rounded-full flex items-center justify-center border border-foreground/15 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
    >
      {mounted && isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}
