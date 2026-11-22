import type { Metadata } from "next";
import { Playlists } from "./playlists";

export const metadata: Metadata = { title: "Playlists" };

export default function PlaylistsPage() {
  return <Playlists />;
}
