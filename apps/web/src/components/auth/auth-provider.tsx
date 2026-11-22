"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, refreshSession } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
  canRefresh,
}: {
  children: ReactNode;
  initialUser: User | null;
  canRefresh: boolean;
}) {
  const [user, setUser] = useState(initialUser);
  const [serverUser, setServerUser] = useState(initialUser);
  const router = useRouter();
  const queryClient = useQueryClient();

  // the server render follows the cookies: adopt its user whenever it changes
  if (initialUser !== serverUser) {
    setServerUser(initialUser);
    setUser(initialUser);
  }

  // access token expired but a refresh token exists: renew silently, then
  // re-render server components with the new cookies
  useEffect(() => {
    if (initialUser || !canRefresh) return;
    let cancelled = false;
    refreshSession().then(async (ok) => {
      if (!ok || cancelled) return;
      const me = await api<User>("/user/current-user-details").catch(() => null);
      if (!cancelled && me) {
        setUser(me);
        router.refresh();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialUser, canRefresh, router]);

  const logout = useCallback(async () => {
    await api("/user/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    queryClient.clear();
    router.push("/");
    router.refresh();
  }, [queryClient, router]);

  const value = useMemo(() => ({ user, setUser, logout }), [user, logout]);
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Returns a function that runs `action` if logged in, otherwise sends to login. */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  return useCallback(
    (action: () => void) => {
      if (user) return action();
      const next = window.location.pathname + window.location.search;
      router.push(`/login?next=${encodeURIComponent(next)}`);
    },
    [user, router],
  );
}
