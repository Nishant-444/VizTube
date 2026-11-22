"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col gap-1 overflow-y-auto p-3 md:flex"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-4 rounded-lg px-3 py-2 text-sm hover:bg-muted",
            isActive(pathname, href) && "bg-muted font-medium",
          )}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) =>
    ["/", "/feed", "/playlists", "/studio"].includes(i.href),
  );
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background py-1 md:hidden"
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]",
            isActive(pathname, href) ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
          {label.split(" ")[0]}
        </Link>
      ))}
    </nav>
  );
}
