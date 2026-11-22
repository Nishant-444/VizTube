import { VideoGrid } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { serverApi } from "@/lib/api/server";
import type { PagedVideos } from "@/lib/api/types";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  const data = await serverApi<PagedVideos>(`/videos?page=${page}&limit=24&sortBy=createdAt`);

  if (!data?.docs.length) {
    return (
      <EmptyState
        title="No videos yet"
        description="Uploaded videos will show up here. Be the first to share one."
      />
    );
  }

  return (
    <>
      <h1 className="sr-only">Latest videos</h1>
      <VideoGrid videos={data.docs} />
      <Pagination page={page} totalPages={data.totalPages} href={(p) => `/?page=${p}`} />
    </>
  );
}
