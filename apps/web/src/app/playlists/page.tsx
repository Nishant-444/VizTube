import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { Playlists } from "./playlists";

export const metadata: Metadata = { title: "Playlists" };

export default function PlaylistsPage() {
  return (
    <RequireAuth title="Sign in to see your playlists" description="Sign in to create playlists and save videos to them.">
      <Playlists />
    </RequireAuth>
  );
}
