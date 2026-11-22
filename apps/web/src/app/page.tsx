import { VideoGrid, VideoList } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { serverApi } from "@/lib/api/server";
import type { PagedVideos } from "@/lib/api/types";

const SORTS = [
  { value: "createdAt", label: "Newest" },
  { value: "views", label: "Most viewed" },
  { value: "duration", label: "Longest" },
];
const LIMIT = 24;

export default async function DiscoverPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const page = Math.max(Number(params.page) || 1, 1);
  const sort = SORTS.some((s) => s.value === params.sort) ? String(params.sort) : "createdAt";
  const view = params.view === "list" ? "list" : "grid";

  const data = await serverApi<PagedVideos>(`/videos?page=${page}&limit=${LIMIT}&sortBy=${sort}`);
  const href = (o: { page?: number; sort?: string; view?: string }) =>
    `/?${new URLSearchParams({
      sort: o.sort ?? sort,
      view: o.view ?? view,
      ...(o.page && o.page > 1 ? { page: String(o.page) } : {}),
    })}`;

  return (
    <>
      <PageHeader
        title="All videos"
        count={data?.totalDocs ?? 0}
        actions={
          <ListToolbar
            sorts={SORTS.map((s) => ({ ...s, href: href({ sort: s.value }) }))}
            sort={sort}
            view={view}
            viewHrefs={{ grid: href({ view: "grid" }), list: href({ view: "list" }) }}
          />
        }
      />
      {!data?.docs.length ? (
        <EmptyState title="No videos yet" description="Uploaded videos will show up here. Be the first to share one." />
      ) : view === "list" ? (
        <VideoList videos={data.docs} />
      ) : (
        <VideoGrid videos={data.docs} />
      )}
      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          totalDocs={data.totalDocs}
          limit={LIMIT}
          href={(p) => href({ page: p })}
        />
      )}
    </>
  );
}
