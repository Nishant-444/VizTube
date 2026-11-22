import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { Studio } from "./studio";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <RequireAuth title="Sign in to open Studio" description="Sign in to manage your videos and see channel stats.">
      <Studio />
    </RequireAuth>
  );
}
