import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo";

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
    <div className="mx-auto mt-6 w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
      <LogoMark size={44} />
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {children}
      <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}
