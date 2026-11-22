"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { VideoGrid } from "@/components/video/video-card";
import { Alert, EmptyState, Spinner } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import type { FeedPage } from "@/lib/api/types";

export function Feed() {
  const feed = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) =>
      api<FeedPage>(`/videos/feed?limit=24${pageParam ? `&cursor=${pageParam}` : ""}`),
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;

  // load the next page when the bottom of the list scrolls into view
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (feed.isLoading) return <Spinner />;
  if (feed.isError) return <Alert>{errorMessage(feed.error)}</Alert>;

  const videos = feed.data?.pages.flatMap((p) => p.items) ?? [];
  if (!videos.length) {
    return (
      <EmptyState
        title="Nothing here yet"
        description="Subscribe to channels and their newest videos will show up here."
      />
    );
  }

  return (
    <>
      <VideoGrid videos={videos} />
      <div ref={sentinel} className="flex justify-center py-8">
        {isFetchingNextPage && <Spinner />}
      </div>
    </>
  );
}
