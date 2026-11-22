"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import type { User } from "@/lib/api/types";

export function Providers({
  children,
  initialUser,
  canRefresh,
}: {
  children: ReactNode;
  initialUser: User | null;
  canRefresh: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={initialUser} canRefresh={canRefresh}>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
