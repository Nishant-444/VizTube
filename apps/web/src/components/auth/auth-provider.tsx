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
import { api, AUTH_REQUIRED_EVENT, refreshSession } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { SignInDialog } from "./sign-in-dialog";

interface AuthContextValue {
  user: User | null;
  /** True while an expired session is being renewed in the background. */
  restoring: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  /** Open the sign-in dialog, optionally explaining why. */
  promptSignIn: (reason?: string) => void;
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
  const [restoring, setRestoring] = useState(!initialUser && canRefresh);
  const [dialog, setDialog] = useState<{ open: boolean; reason?: string }>({ open: false });
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
    refreshSession()
      .then(async (ok) => {
        if (!ok || cancelled) return;
        const me = await api<User>("/user/current-user-details").catch(() => null);
        if (!cancelled && me) {
          setUser(me);
          router.refresh();
        }
      })
      .finally(() => !cancelled && setRestoring(false));
    return () => {
      cancelled = true;
    };
  }, [initialUser, canRefresh, router]);

  const promptSignIn = useCallback((reason?: string) => setDialog({ open: true, reason }), []);
  const closeDialog = useCallback(() => setDialog({ open: false }), []);

  // any API call that still gets 401 after a refresh attempt lands here
  useEffect(() => {
    const onAuthRequired = () => {
      setUser(null);
      queryClient.removeQueries({ predicate: (q) => q.state.status === "error" });
      setDialog({ open: true, reason: "Your session has ended. Sign in again to continue." });
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
  }, [queryClient]);

  const onSignedIn = useCallback(
    (signedIn: User) => {
      setUser(signedIn);
      setDialog({ open: false });
      void queryClient.invalidateQueries();
      router.refresh();
    },
    [queryClient, router],
  );

  const logout = useCallback(async () => {
    await api("/user/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    queryClient.clear();
    router.push("/");
    router.refresh();
  }, [queryClient, router]);

  const value = useMemo(
    () => ({ user, restoring, setUser, logout, promptSignIn }),
    [user, restoring, logout, promptSignIn],
  );

  return (
    <AuthContext value={value}>
      {children}
      <SignInDialog open={dialog.open} reason={dialog.reason} onClose={closeDialog} onSignedIn={onSignedIn} />
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Returns a function that runs `action` when signed in, otherwise opens the sign-in dialog. */
export function useRequireAuth() {
  const { user, promptSignIn } = useAuth();
  return useCallback(
    (action: () => void, reason?: string) => {
      if (user) return action();
      promptSignIn(reason);
    },
    [user, promptSignIn],
  );
}
