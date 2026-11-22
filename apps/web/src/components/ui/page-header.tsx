import type { ReactNode } from "react";

/** Section heading: "All videos 28" with optional description and actions on the right. */
export function PageHeader({
  title,
  count,
  description,
  actions,
}: {
  title: string;
  count?: number;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          {title}
          {count !== undefined && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              {count}
            </span>
          )}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
