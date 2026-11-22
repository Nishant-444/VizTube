import {
  Clock,
  Home,
  LayoutDashboard,
  ListVideo,
  Rss,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  auth?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Subscriptions", icon: Rss, auth: true },
  { href: "/history", label: "History", icon: Clock, auth: true },
  { href: "/liked", label: "Liked videos", icon: ThumbsUp, auth: true },
  { href: "/playlists", label: "Playlists", icon: ListVideo, auth: true },
  { href: "/studio", label: "Studio", icon: LayoutDashboard, auth: true },
];
