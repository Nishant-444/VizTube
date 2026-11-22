"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Alert, Spinner } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

/** Email-or-username + password form, used by /login and the sign-in dialog. */
export function SignInForm({
  onSignedIn,
  autoFocus,
  idPrefix = "signin",
}: {
  onSignedIn: (user: User) => void;
  autoFocus?: boolean;
  idPrefix?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ identifier, password }: Values) => {
    setError(null);
    try {
      const credential = identifier.includes("@") ? { email: identifier } : { username: identifier };
      const data = await api<{ user: User }>("/user/login", {
        method: "POST",
        json: { ...credential, password },
      });
      onSignedIn(data.user);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-identifier`}>Email or username</Label>
        <Input
          id={`${idPrefix}-identifier`}
          autoComplete="username"
          autoFocus={autoFocus}
          {...register("identifier")}
        />
        <FieldError message={errors.identifier?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-password`}>Password</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Sign in
      </Button>
    </form>
  );
}
