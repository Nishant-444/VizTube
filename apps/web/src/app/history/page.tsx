import type { Metadata } from "next";
import { SignInRequired } from "@/components/auth/require-auth";
import { VideoGrid } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser, serverApi } from "@/lib/api/server";
import type { VideoWithOwner } from "@/lib/api/types";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  if (!(await getCurrentUser())) {
    return (
      <SignInRequired
        title="Sign in to see your history"
        description="Sign in to keep track of the videos you've watched."
      />
    );
  }

  // the API answers 404 when the history is empty
  const videos = (await serverApi<VideoWithOwner[]>("/user/watch-history")) ?? [];
  return (
    <div>
      <PageHeader title="Watch history" count={videos.length} />
      {videos.length ? (
        <VideoGrid videos={videos} />
      ) : (
        <EmptyState title="No watch history" description="Videos you watch will be listed here." />
      )}
    </div>
  );
}
