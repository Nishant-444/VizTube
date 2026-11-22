import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto mt-8 w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
      <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
          ▶
        </span>
        VizTube
      </Link>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {children}
      <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}
