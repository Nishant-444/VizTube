"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuth } from "@/components/auth/auth-provider";
import { SignInForm } from "@/components/auth/sign-in-form";
import { safeNext } from "@/lib/safe-redirect";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { setUser } = useAuth();

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to VizTube"
      footer={
        <>
          New here?{" "}
          <Link
            href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-foreground underline underline-offset-2"
          >
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm
        autoFocus
        onSignedIn={(user) => {
          setUser(user);
          router.replace(next);
          router.refresh();
        }}
      />
    </AuthCard>
  );
}
