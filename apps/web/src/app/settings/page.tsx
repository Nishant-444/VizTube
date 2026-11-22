import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { Settings } from "./settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <RequireAuth title="Sign in to change settings" description="Sign in to manage your profile and password.">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <PageHeader title="Account settings" />
        <Settings />
      </div>
    </RequireAuth>
  );
}
