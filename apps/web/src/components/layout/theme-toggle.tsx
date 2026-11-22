"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { buttonVariants } from "@/components/ui/button";

export const THEME_KEY = "viztube-theme";

// read the class the inline script in layout.tsx set before paint
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* private mode: theme just won't persist */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className={buttonVariants({ variant: "outline", size: "icon" })}
    >
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}
