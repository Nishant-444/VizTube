"use client";

import { LogOut, Search, Settings, Upload, User as UserIcon, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";

function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [q, setQ] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);

  // follow the URL when it changes (back/forward, links)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setQ(urlQuery);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={submit} role="search" className="flex w-full max-w-xl">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        aria-label="Search videos"
        className="h-10 w-full rounded-l-full border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex h-10 w-14 items-center justify-center rounded-r-full border border-l-0 bg-muted hover:bg-accent"
      >
        <Search className="size-5" />
      </button>
    </form>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!user) {
    return (
      <Link href="/login" className={buttonVariants({ variant: "outline" })}>
        <UserIcon /> Sign in
      </Link>
    );
  }

  const item =
    "flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted";
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar src={user.avatar} alt={user.fullname} size={34} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border bg-card py-2 shadow-lg"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center gap-3 border-b px-4 pb-3">
            <Avatar src={user.avatar} alt={user.fullname} size={40} />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.fullname}</p>
              <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <Link href={`/c/${user.username}`} className={item}>
            <UserIcon className="size-4" /> Your channel
          </Link>
          <Link href="/studio" className={item}>
            <LayoutDashboard className="size-4" /> Studio
          </Link>
          <Link href="/settings" className={item}>
            <Settings className="size-4" /> Settings
          </Link>
          <button onClick={() => void logout()} className={item}>
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur">
      <Link href="/" className="flex shrink-0 items-center gap-1.5 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
          ▶
        </span>
        <span className="hidden sm:inline">VizTube</span>
      </Link>
      <div className="flex flex-1 justify-center">
        {/* useSearchParams needs a Suspense boundary */}
        <Suspense fallback={<div className="h-10 w-full max-w-xl" />}>
          <SearchBox />
        </Suspense>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {user && (
          <Link
            href="/upload"
            className={buttonVariants({ variant: "secondary", className: "hidden sm:inline-flex" })}
          >
            <Upload /> Upload
          </Link>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
