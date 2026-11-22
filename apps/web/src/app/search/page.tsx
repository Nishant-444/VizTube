import type { Metadata } from "next";
import { VideoList } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { serverApi } from "@/lib/api/server";
import type { PagedVideos } from "@/lib/api/types";

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "createdAt", label: "Upload date" },
  { value: "views", label: "View count" },
];
const LIMIT = 20;

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: typeof q === "string" && q ? `${q} - Search` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const sort = SORTS.some((s) => s.value === params.sort) ? String(params.sort) : "relevance";
  const page = Math.max(Number(params.page) || 1, 1);

  if (!q) {
    return (
      <EmptyState
        title="Search VizTube"
        description='Use Quick Search in the sidebar, or press "/" anywhere. "Exact phrases" and -exclude work too.'
      />
    );
  }

  const query = new URLSearchParams({ query: q, page: String(page), limit: String(LIMIT), sortBy: sort });
  const data = await serverApi<PagedVideos>(`/videos?${query}`);
  const href = (o: { page?: number; sort?: string }) =>
    `/search?${new URLSearchParams({ q, sort: o.sort ?? sort, ...(o.page && o.page > 1 ? { page: String(o.page) } : {}) })}`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={`Results for “${q}”`}
        count={data?.totalDocs ?? 0}
        actions={<ListToolbar sorts={SORTS.map((s) => ({ ...s, href: href({ sort: s.value }) }))} sort={sort} />}
      />
      {data?.docs.length ? (
        <VideoList videos={data.docs} />
      ) : (
        <EmptyState title="No results" description='Try different keywords. You can use "exact phrases" and -exclude words.' />
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
    </div>
  );
}
