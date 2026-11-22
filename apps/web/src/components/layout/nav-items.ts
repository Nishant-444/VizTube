import {
  Clock,
  LayoutDashboard,
  LayoutGrid,
  ListVideo,
  Rss,
  Settings,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Discover", icon: LayoutGrid },
  { href: "/feed", label: "Subscriptions", icon: Rss },
  { href: "/history", label: "History", icon: Clock },
  { href: "/liked", label: "Liked videos", icon: ThumbsUp },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
  { href: "/studio", label: "Studio", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/** Title shown in the top bar for the current route. */
export function pageTitle(pathname: string) {
  const exact = NAV_ITEMS.find((i) => isActive(pathname, i.href));
  if (exact) return exact.label;
  if (pathname.startsWith("/watch/")) return "Watch";
  if (pathname.startsWith("/c/")) return "Channel";
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/upload")) return "Upload";
  if (pathname.startsWith("/login")) return "Sign in";
  if (pathname.startsWith("/register")) return "Create account";
  return "VizTube";
}
