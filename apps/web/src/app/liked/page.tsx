import type { Metadata } from "next";
import { SignInRequired } from "@/components/auth/require-auth";
import { VideoGrid } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import type { VideoWithOwner } from "@/lib/api/types";

export const metadata: Metadata = { title: "Liked videos" };

export default async function LikedPage() {
  if (!(await getCurrentUser())) {
    return (
      <SignInRequired
        title="Sign in to see liked videos"
        description="Sign in to keep the videos you like in one place."
      />
    );
  }

  const videos = (await serverApi<VideoWithOwner[]>("/likes/videos")) ?? [];
  // a liked video may since have been unpublished by its owner
  const visible = videos.filter((v) => v.isPublished);
  return (
    <>
      <PageHeader title="Liked videos" count={visible.length} />
      {visible.length ? (
        <VideoGrid videos={visible} />
      ) : (
        <EmptyState title="No liked videos" description="Use the thumbs up on a video to save it here." />
      )}
    </>
  );
}
