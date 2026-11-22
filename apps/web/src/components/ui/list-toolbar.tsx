"use client";

import { ArrowDownUp, Check, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SortOption {
  value: string;
  label: string;
  /** URL that applies this sort */
  href: string;
}

/**
 * "Sort by" dropdown plus optional grid/list toggle. Pages pass ready-made
 * URLs (functions can't cross the server/client boundary), so they stay
 * server-rendered.
 */
export function ListToolbar({
  sorts,
  sort,
  view,
  viewHrefs,
}: {
  sorts: SortOption[];
  sort: string;
  view?: "grid" | "list";
  viewHrefs?: { grid: string; list: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const current = sorts.find((s) => s.value === sort) ?? sorts[0];

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowDownUp />
          <span>
            Sort by<span className="hidden text-muted-foreground sm:inline">: {current.label}</span>
          </span>
        </button>
        {open && (
          <div role="menu" className="absolute right-0 z-30 mt-1.5 w-44 rounded-lg border bg-card p-1 shadow-lg">
            {sorts.map((s) => (
              <Link
                key={s.value}
                role="menuitem"
                href={s.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-muted"
              >
                {s.label}
                {s.value === current.value && <Check className="size-4" />}
              </Link>
            ))}
          </div>
        )}
      </div>
      {view && viewHrefs && (
        <div className="flex rounded-lg border p-0.5" role="group" aria-label="Layout">
          {(["list", "grid"] as const).map((v) => {
            const Icon = v === "grid" ? LayoutGrid : List;
            return (
              <Link
                key={v}
                href={viewHrefs[v]}
                aria-label={v === "grid" ? "Grid view" : "List view"}
                aria-current={view === v ? "true" : undefined}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
