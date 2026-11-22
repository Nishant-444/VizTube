import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// 1 … 4 5 [6] 7 8 … 15
function pageList(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  totalDocs,
  limit,
  href,
}: {
  page: number;
  totalPages: number;
  totalDocs?: number;
  limit?: number;
  href: (page: number) => string;
}) {
  const from = totalDocs && limit ? (page - 1) * limit + 1 : 0;
  const to = totalDocs && limit ? Math.min(page * limit, totalDocs) : 0;
  const edge = "flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm";

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
      <p className="text-sm text-muted-foreground">
        {totalDocs ? (
          <>
            Results: <span className="text-foreground">{from} – {to}</span> of {totalDocs}
          </>
        ) : null}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} className={cn(edge, "hover:bg-muted")}>
              <ChevronLeft className="size-4" /> Previous
            </Link>
          ) : (
            <span className={cn(edge, "text-muted-foreground/60")}>
              <ChevronLeft className="size-4" /> Previous
            </span>
          )}
          {pageList(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-sm",
                  p === page ? "border bg-background font-medium shadow-xs" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {p}
              </Link>
            ),
          )}
          {page < totalPages ? (
            <Link href={href(page + 1)} className={cn(edge, "hover:bg-muted")}>
              Next <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className={cn(edge, "text-muted-foreground/60")}>
              Next <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
