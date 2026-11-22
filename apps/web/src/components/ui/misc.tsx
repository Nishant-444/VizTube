import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { cn, secureUrl } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  size = 36,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    // plain img: avatars are tiny and come from many Cloudinary transforms
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={secureUrl(src) || "/avatar.svg"}
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full bg-muted object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & {
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} />;
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-sidebar px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

export function Alert({
  children,
  tone = "danger",
}: {
  children: React.ReactNode;
  tone?: "danger" | "info";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}
