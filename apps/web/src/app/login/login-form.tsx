"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Alert, Spinner } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { safeNext } from "@/lib/safe-redirect";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ identifier, password }: Values) => {
    setError(null);
    try {
      const credential = identifier.includes("@")
        ? { email: identifier }
        : { username: identifier };
      const data = await api<{ user: User }>("/user/login", {
        method: "POST",
        json: { ...credential, password },
      });
      setUser(data.user);
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="to continue to VizTube"
      footer={
        <>
          New here?{" "}
          <Link
            href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-foreground underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="identifier">Email or username</Label>
          <Input id="identifier" autoComplete="username" autoFocus {...register("identifier")} />
          <FieldError message={errors.identifier?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
