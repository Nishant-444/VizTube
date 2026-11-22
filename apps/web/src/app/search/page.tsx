import type { Metadata } from "next";
import Link from "next/link";
import { VideoRow } from "@/components/video/video-card";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { serverApi } from "@/lib/api/server";
import type { PagedVideos } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "createdAt", label: "Upload date" },
  { value: "views", label: "View count" },
] as const;

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
    return <EmptyState title="Search VizTube" description="Type something in the search bar to find videos." />;
  }

  const query = new URLSearchParams({ query: q, page: String(page), limit: "20", sortBy: sort });
  const data = await serverApi<PagedVideos>(`/videos?${query}`);
  const href = (overrides: Record<string, string>) =>
    `/search?${new URLSearchParams({ q, sort, ...overrides })}`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg">
          {data?.totalDocs ?? 0} result{data?.totalDocs === 1 ? "" : "s"} for{" "}
          <span className="font-semibold">&ldquo;{q}&rdquo;</span>
        </h1>
        <div className="flex gap-2" role="group" aria-label="Sort results">
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={href({ sort: s.value })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm",
                sort === s.value ? "bg-foreground text-background" : "bg-muted hover:bg-accent",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {data?.docs.length ? (
        <div className="flex flex-col gap-6">
          {data.docs.map((v) => (
            <VideoRow key={v.id} video={v} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No results"
          description='Try different keywords. You can use "exact phrases" and -exclude words.'
        />
      )}
      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        href={(p) => href({ page: String(p) })}
      />
    </div>
  );
}
