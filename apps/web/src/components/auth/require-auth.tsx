"use client";

import { Lock } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { useAuth } from "./auth-provider";

/**
 * Placeholder for a page that needs an account. Opens the sign-in dialog once
 * on arrival; if the visitor closes it, a button stays to reopen it.
 */
export function SignInRequired({ title, description }: { title: string; description: string }) {
  const { user, restoring, promptSignIn } = useAuth();

  useEffect(() => {
    if (!user && !restoring) promptSignIn(description);
  }, [user, restoring, promptSignIn, description]);

  if (restoring) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-sidebar px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl border bg-background">
        <Lock className="size-5 text-muted-foreground" />
      </span>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="primary" className="mt-2" onClick={() => promptSignIn(description)}>
        Sign in
      </Button>
    </div>
  );
}

/** Renders children only for signed-in users; everyone else gets the sign-in prompt. */
export function RequireAuth({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const { user } = useAuth();
  if (!user) return <SignInRequired title={title} description={description} />;
  return <>{children}</>;
}
