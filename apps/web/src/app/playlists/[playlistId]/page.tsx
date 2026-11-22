import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";
import { PlaylistView } from "./playlist-view";

export const metadata: Metadata = { title: "Playlist" };

export default async function PlaylistPage({ params }: PageProps<"/playlists/[playlistId]">) {
  const { playlistId } = await params;
  return (
    <RequireAuth title="Sign in to view this playlist" description="Sign in to view playlists.">
      <PlaylistView playlistId={playlistId} />
    </RequireAuth>
  );
}
