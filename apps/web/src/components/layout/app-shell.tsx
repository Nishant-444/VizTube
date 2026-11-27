'use client';

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
  PlusCircle,
  Search,
  Settings,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { buttonVariants } from '@/components/ui/button';
import { Avatar } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { isActive, NAV_ITEMS, pageTitle } from './nav-items';

function QuickSearch({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const [q, setQ] = useState(urlQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // follow the URL when it changes (back/forward, links)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setQ(urlQuery);
  }

  // "/" focuses search from anywhere, unless the user is already typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable;
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onNavigate();
  };

  if (collapsed) {
    return (
      <Link
        href="/search"
        aria-label="Search"
        title="Search"
        className="flex h-10 items-center justify-center rounded-lg border bg-background hover:bg-muted"
      >
        <Search className="size-4" />
      </Link>
    );
  }

  return (
    <form onSubmit={submit} role="search" className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Quick Search"
        aria-label="Search videos"
        className="h-10 w-full rounded-lg border bg-background pl-9 pr-9 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded border bg-background text-[11px] text-muted-foreground">
        /
      </kbd>
    </form>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onNavigate,
  isDrawer,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
  isDrawer?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-16 items-center border-b px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <Logo collapsed={collapsed} />
        {/* the mobile drawer closes from the top; the desktop toggle lives in the footer */}
        {isDrawer && (
          <button
            onClick={onToggleCollapse}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <Suspense
          fallback={<div className="h-10 rounded-lg border bg-background" />}
        >
          <QuickSearch collapsed={collapsed} onNavigate={onNavigate} />
        </Suspense>
        {/* signed-out visitors use the Sign in button in the top bar */}
        {user && (
          <Link
            href="/upload"
            onClick={onNavigate}
            title={collapsed ? 'Upload video' : undefined}
            className={cn(
              'mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted',
              collapsed && 'justify-center px-0'
            )}
          >
            <PlusCircle className="size-[18px] text-muted-foreground" />
            {!collapsed && 'Upload video'}
          </Link>
        )}
      </div>

      <nav
        aria-label="Main"
        className="flex flex-col gap-0.5 border-t px-3 py-3"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground',
                active && 'bg-accent font-medium text-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon
                className={cn(
                  'size-[18px]',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {!isDrawer && (
        <div className="mt-auto border-t p-3">
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <PanelLeft className="size-[18px]" />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout, promptSignIn } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!user) {
    return (
      <button
        onClick={() => promptSignIn()}
        className={buttonVariants({ variant: 'primary' })}
      >
        Sign in
      </button>
    );
  }

  const item =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted';
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar src={user.avatar} alt={user.fullname} size={32} />
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-60 rounded-xl border bg-card p-1.5 shadow-lg"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar src={user.avatar} alt={user.fullname} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.fullname}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </div>
          <div className="my-1 border-t" />
          <Link href={`/c/${user.username}`} className={item}>
            <UserIcon className="size-4 text-muted-foreground" /> Your channel
          </Link>
          <Link href="/studio" className={item}>
            <LayoutDashboard className="size-4 text-muted-foreground" /> Studio
          </Link>
          <Link href="/settings" className={item}>
            <Settings className="size-4 text-muted-foreground" /> Settings
          </Link>
          <div className="my-1 border-t" />
          <button onClick={() => void logout()} className={item}>
            <LogOut className="size-4 text-muted-foreground" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <p className="truncate text-lg font-semibold tracking-tight">
        {pageTitle(pathname)}
      </p>
      <div className="ml-auto flex items-center gap-2">
        {user && (
          <Link
            href="/upload"
            aria-label="Upload video"
            title="Upload video"
            className={buttonVariants({ variant: 'outline', size: 'icon' })}
          >
            <Upload />
          </Link>
        )}
        <UserMenu />
      </div>
    </header>
  );
}

// remembered across visits; read through useSyncExternalStore so it stays in sync between tabs
const SIDEBAR_KEY = 'viztube-sidebar';
const SIDEBAR_EVENT = 'viztube-sidebar-change';
const subscribeSidebar = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(SIDEBAR_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(SIDEBAR_EVENT, onChange);
  };
};
const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed';
  } catch {
    return false;
  }
};
const setCollapsedPref = (value: boolean) => {
  try {
    localStorage.setItem(SIDEBAR_KEY, value ? 'collapsed' : 'expanded');
  } catch {
    /* private mode: just won't persist */
  }
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
};

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    readCollapsed,
    () => false
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  // close the mobile drawer after navigating
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const esc = (e: KeyboardEvent) =>
      e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r bg-sidebar transition-[width] lg:block',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsedPref(!collapsed)}
          onNavigate={() => {}}
        />
      </aside>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-sidebar shadow-xl">
            <SidebarContent
              collapsed={false}
              isDrawer
              onToggleCollapse={() => setDrawerOpen(false)}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
