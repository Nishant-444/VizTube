import type { Metadata } from "next";
import { VideoRow } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { serverApi } from "@/lib/api/server";
import type { VideoWithOwner } from "@/lib/api/types";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  // the API answers 404 when the history is empty
  const videos = await serverApi<VideoWithOwner[]>("/user/watch-history");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold">Watch history</h1>
      {videos?.length ? (
        <div className="flex flex-col gap-6">
          {videos.map((v) => (
            <VideoRow key={v.id} video={v} />
          ))}
        </div>
      ) : (
        <EmptyState title="No watch history" description="Videos you watch will be listed here." />
      )}
    </div>
  );
}
