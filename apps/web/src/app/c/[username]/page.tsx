import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoGrid } from "@/components/video/video-card";
import { SubscribeButton } from "@/components/video/subscribe-button";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { serverApi } from "@/lib/api/server";
import type { ChannelProfile, PagedVideos } from "@/lib/api/types";
import { formatCount, secureUrl } from "@/lib/utils";

const SORTS = [
  { value: "createdAt", label: "Newest" },
  { value: "views", label: "Most viewed" },
];
const LIMIT = 24;

const getChannel = (username: string) => serverApi<ChannelProfile>(`/user/c/${encodeURIComponent(username)}`);

export async function generateMetadata({ params }: PageProps<"/c/[username]">): Promise<Metadata> {
  const { username } = await params;
  const channel = await getChannel(username);
  if (!channel) return { title: "Channel not found" };
  return {
    title: channel.fullname,
    description: `Videos from ${channel.fullname} (@${channel.username}) on VizTube`,
    openGraph: { title: channel.fullname, images: [secureUrl(channel.avatar)] },
  };
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
      {label}: <span className="font-medium text-foreground">{formatCount(value)}</span>
    </span>
  );
}

export default async function ChannelPage({ params, searchParams }: PageProps<"/c/[username]">) {
  const { username } = await params;
  const query = await searchParams;
  const page = Math.max(Number(query.page) || 1, 1);
  const sort = SORTS.some((s) => s.value === query.sort) ? String(query.sort) : "createdAt";
  const channel = await getChannel(username);
  if (!channel) notFound();

  const videos = await serverApi<PagedVideos>(
    `/videos?userId=${channel.id}&page=${page}&limit=${LIMIT}&sortBy=${sort}`,
  );
  const isOwner = channel.email !== undefined;
  const href = (o: { page?: number; sort?: string }) =>
    `/c/${channel.username}?${new URLSearchParams({ sort: o.sort ?? sort, ...(o.page && o.page > 1 ? { page: String(o.page) } : {}) })}`;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="mb-8 overflow-hidden rounded-2xl border bg-card">
        {channel.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={secureUrl(channel.coverImage)} alt="" className="aspect-[6/1] w-full bg-muted object-cover" />
        ) : (
          <div className="aspect-[8/1] w-full bg-gradient-to-r from-muted to-accent" />
        )}
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
          <Avatar
            src={channel.avatar}
            alt={channel.fullname}
            size={88}
            className="-mt-14 border-4 border-card"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{channel.fullname}</h1>
            <p className="text-sm text-muted-foreground">@{channel.username}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Stat label="Subscribers" value={channel.subscriberCount} />
              <Stat label="Videos" value={videos?.totalDocs ?? 0} />
              <Stat label="Following" value={channel.channelsSubscribedToCount} />
            </div>
          </div>
          {isOwner ? (
            <span className="rounded-md bg-muted px-2.5 py-1.5 text-sm text-muted-foreground">Your channel</span>
          ) : (
            <SubscribeButton
              channelId={channel.id}
              initialSubscribed={channel.isSubscribed}
              initialCount={channel.subscriberCount}
            />
          )}
        </div>
      </section>

      <PageHeader
        title="Videos"
        count={videos?.totalDocs ?? 0}
        actions={<ListToolbar sorts={SORTS.map((s) => ({ ...s, href: href({ sort: s.value }) }))} sort={sort} />}
      />
      {videos?.docs.length ? (
        <>
          <VideoGrid videos={videos.docs} hideChannel />
          <Pagination
            page={page}
            totalPages={videos.totalPages}
            totalDocs={videos.totalDocs}
            limit={LIMIT}
            href={(p) => href({ page: p })}
          />
        </>
      ) : (
        <EmptyState
          title="No videos yet"
          description={isOwner ? "Upload your first video from the sidebar." : undefined}
        />
      )}
    </div>
  );
}
