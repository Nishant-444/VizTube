import type { Metadata } from "next";
import { PlaylistView } from "./playlist-view";

export const metadata: Metadata = { title: "Playlist" };

export default async function PlaylistPage({ params }: PageProps<"/playlists/[playlistId]">) {
  const { playlistId } = await params;
  return <PlaylistView playlistId={playlistId} />;
}
