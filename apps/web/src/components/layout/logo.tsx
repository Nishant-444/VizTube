import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      priority
      className={cn("shrink-0", className)}
    />
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="VizTube home">
      <LogoMark />
      {!collapsed && <span className="text-[19px] font-semibold tracking-tight">VizTube</span>}
    </Link>
  );
}
