"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoMark } from "@/components/layout/logo";
import type { User } from "@/lib/api/types";
import { SignInForm } from "./sign-in-form";

/** Modal sign-in prompt shown when something needs an account. */
export function SignInDialog({
  open,
  reason,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  reason?: string;
  onClose: () => void;
  onSignedIn: (user: User) => void;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // keep Tab inside the dialog
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      returnFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const next = encodeURIComponent(pathname);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-dialog-title"
        className="relative w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <LogoMark size={56} className="mx-auto" />
        <h2 id="signin-dialog-title" className="mt-3 text-center text-lg font-semibold">
          Sign in to continue
        </h2>
        <p className="mb-5 mt-1 text-center text-sm text-muted-foreground">
          {reason ?? "You need a VizTube account for this."}
        </p>
        <SignInForm idPrefix="dialog" autoFocus onSignedIn={onSignedIn} />
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href={`/register?next=${next}`}
            onClick={onClose}
            className="font-medium text-foreground underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
