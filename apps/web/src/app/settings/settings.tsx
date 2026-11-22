"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Alert, Avatar, Spinner } from "@/components/ui/misc";
import { api, ApiClientError, errorMessage } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { imageFileError, passwordSchema } from "@/lib/validation";

const describe = (e: unknown) =>
  e instanceof ApiClientError && e.errors.length ? e.errors.join(". ") : errorMessage(e);

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

function Status({ ok, error }: { ok?: string | null; error?: string | null }) {
  if (error) return <Alert>{error}</Alert>;
  if (ok) return <Alert tone="info">{ok}</Alert>;
  return null;
}

const profileSchema = z.object({
  fullname: z.string().trim().min(1, "Enter your name"),
  username: z.string().trim().min(3, "At least 3 characters").regex(/^\S+$/, "No spaces"),
  email: z.email("Enter a valid email").trim(),
});

function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullname: user.fullname, username: user.username, email: user.email },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus({});
    try {
      const updated = await api<User>("/user/update-account", { method: "PATCH", json: values });
      setUser(updated);
      router.refresh();
      setStatus({ ok: "Profile saved." });
    } catch (e) {
      setStatus({ error: describe(e) });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Status {...status} />
      {(["fullname", "username", "email"] as const).map((field) => (
        <div key={field} className="flex flex-col gap-1.5">
          <Label htmlFor={field}>{{ fullname: "Name", username: "Username", email: "Email" }[field]}</Label>
          <Input id={field} type={field === "email" ? "email" : "text"} {...register(field)} />
          <FieldError message={errors[field]?.message} />
        </div>
      ))}
      <Button type="submit" variant="inverted" className="self-start" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Save profile
      </Button>
    </form>
  );
}

function ImageForm({ kind }: { kind: "avatar" | "coverImage" }) {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const [pending, setPending] = useState(false);
  const fileError = imageFileError(file);

  const save = async () => {
    if (!file || fileError) return;
    setPending(true);
    setStatus({});
    try {
      const form = new FormData();
      form.append(kind, file);
      const path = kind === "avatar" ? "/user/update-avatar" : "/user/update-cover-image";
      const updated = await api<User>(path, { method: "PATCH", body: form });
      setUser(updated);
      router.refresh();
      setFile(null);
      setStatus({ ok: "Image updated." });
    } catch (e) {
      setStatus({ error: describe(e) });
    } finally {
      setPending(false);
    }
  };

  const id = `${kind}-file`;
  return (
    <div className="flex flex-col gap-3">
      <Status {...status} />
      <div className="flex items-center gap-4">
        {kind === "avatar" && <Avatar src={user?.avatar} alt="Current avatar" size={64} />}
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={id} className="sr-only">
            {kind === "avatar" ? "Avatar image" : "Cover image"}
          </Label>
          <Input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="h-auto py-1.5 file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1"
          />
          <FieldError message={fileError} />
        </div>
        <Button variant="inverted" onClick={() => void save()} disabled={!file || !!fileError || pending}>
          {pending && <Spinner />} Upload
        </Button>
      </div>
    </div>
  );
}

const passwordFormSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { message: "Passwords don't match", path: ["confirm"] })
  .refine((v) => v.newPassword !== v.oldPassword, { message: "Choose a different password", path: ["newPassword"] });

function PasswordForm() {
  const [status, setStatus] = useState<{ ok?: string; error?: string }>({});
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
  });

  const onSubmit = handleSubmit(async ({ oldPassword, newPassword }) => {
    setStatus({});
    try {
      await api("/user/change-password", { method: "POST", json: { oldPassword, newPassword } });
      reset();
      setStatus({ ok: "Password changed." });
    } catch (e) {
      setStatus({ error: describe(e) });
    }
  });

  const fields = [
    { name: "oldPassword", label: "Current password", auto: "current-password" },
    { name: "newPassword", label: "New password", auto: "new-password" },
    { name: "confirm", label: "Confirm new password", auto: "new-password" },
  ] as const;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Status {...status} />
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input id={f.name} type="password" autoComplete={f.auto} {...register(f.name)} />
          <FieldError message={errors[f.name]?.message} />
        </div>
      ))}
      <Button type="submit" variant="inverted" className="self-start" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Change password
      </Button>
    </form>
  );
}

export function Settings() {
  const { user } = useAuth();
  if (!user) return <Spinner />;
  return (
    <>
      <Section title="Profile" description="Your name, handle and email.">
        <ProfileForm user={user} />
      </Section>
      <Section title="Avatar" description="Shown next to your videos and comments.">
        <ImageForm kind="avatar" />
      </Section>
      <Section title="Cover image" description="The banner at the top of your channel page.">
        <ImageForm kind="coverImage" />
      </Section>
      <Section title="Password" description="8–16 characters with upper and lowercase letters and a number.">
        <PasswordForm />
      </Section>
    </>
  );
}
