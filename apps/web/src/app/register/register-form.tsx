'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthCard } from '@/components/auth/auth-card';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/input';
import { Alert, Spinner } from '@/components/ui/misc';
import { api, ApiClientError, errorMessage } from '@/lib/api/client';
import type { User } from '@/lib/api/types';
import { safeNext } from '@/lib/safe-redirect';
import { imageFileError, passwordSchema } from '@/lib/validation';

const schema = z.object({
  fullname: z.string().trim().min(1, 'Enter your name'),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .regex(/^\S+$/, 'No spaces'),
  email: z.email('Enter a valid email').trim(),
  password: passwordSchema,
});
type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // the API requires an avatar at registration
  const avatarError =
    imageFileError(avatar) ??
    (submitted && !avatar ? 'Choose an avatar image' : undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    if (avatarError || !avatar) return;
    setError(null);
    try {
      const form = new FormData();
      Object.entries(values).forEach(([k, v]) => form.append(k, v));
      form.append('avatar', avatar);
      await api<User>('/user/register', { method: 'POST', body: form });

      // registration doesn't start a session, so sign in right away
      const data = await api<{ user: User }>('/user/login', {
        method: 'POST',
        json: { email: values.email, password: values.password },
      });
      setUser(data.user);
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof ApiClientError && e.errors.length
          ? e.errors.join('. ')
          : errorMessage(e)
      );
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Upload videos, comment, and ask AI about anything you watch."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          setSubmitted(true);
          void handleSubmit(onSubmit)(e);
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullname">Name</Label>
          <Input id="fullname" autoComplete="name" {...register('fullname')} />
          <FieldError message={errors.fullname?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            {...register('username')}
          />
          <FieldError message={errors.username?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
          <p className="text-xs text-muted-foreground">
            8–16 characters with upper and lowercase letters and a number.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="avatar">Avatar</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
            className="h-auto py-1.5 file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1"
          />
          <FieldError message={avatarError} />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting && <Spinner />} Create account
        </Button>
      </form>
    </AuthCard>
  );
}
