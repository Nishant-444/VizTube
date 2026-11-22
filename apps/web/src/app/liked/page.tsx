import type { Metadata } from "next";
import { VideoGrid } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { serverApi } from "@/lib/api/server";
import type { VideoWithOwner } from "@/lib/api/types";

export const metadata: Metadata = { title: "Liked videos" };

export default async function LikedPage() {
  const videos = (await serverApi<VideoWithOwner[]>("/likes/videos")) ?? [];
  // a liked video may since have been unpublished by its owner
  const visible = videos.filter((v) => v.isPublished);
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Liked videos</h1>
      {visible.length ? (
        <VideoGrid videos={visible} />
      ) : (
        <EmptyState title="No liked videos" description="Tap the thumbs up on a video to save it here." />
      )}
    </>
  );
}
