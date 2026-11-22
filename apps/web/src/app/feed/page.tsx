import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageHeader } from "@/components/ui/page-header";
import { Feed } from "./feed";

export const metadata: Metadata = { title: "Subscriptions" };

export default function FeedPage() {
  return (
    <RequireAuth title="Sign in to see your subscriptions" description="Sign in to see the newest videos from channels you follow.">
      <PageHeader title="Latest from your subscriptions" />
      <Feed />
    </RequireAuth>
  );
}
