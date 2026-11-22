import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoGrid } from "@/components/video/video-card";
import { SubscribeButton } from "@/components/video/subscribe-button";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { serverApi } from "@/lib/api/server";
import type { ChannelProfile, PagedVideos } from "@/lib/api/types";
import { formatCount, secureUrl } from "@/lib/utils";

const getChannel = (username: string) =>
  serverApi<ChannelProfile>(`/user/c/${encodeURIComponent(username)}`);

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

export default async function ChannelPage({ params, searchParams }: PageProps<"/c/[username]">) {
  const { username } = await params;
  const page = Math.max(Number((await searchParams).page) || 1, 1);
  const channel = await getChannel(username);
  if (!channel) notFound();

  const videos = await serverApi<PagedVideos>(
    `/videos?userId=${channel.id}&page=${page}&limit=24&sortBy=createdAt`,
  );
  const isOwner = channel.email !== undefined;

  return (
    <div className="mx-auto max-w-7xl">
      {channel.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={secureUrl(channel.coverImage)}
          alt=""
          className="mb-6 aspect-[6/1] w-full rounded-2xl bg-muted object-cover"
        />
      )}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar src={channel.avatar} alt={channel.fullname} size={96} />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{channel.fullname}</h1>
          <p className="text-muted-foreground">
            @{channel.username} · {formatCount(channel.subscriberCount)} subscriber
            {channel.subscriberCount === 1 ? "" : "s"} · {formatCount(videos?.totalDocs ?? 0)} video
            {videos?.totalDocs === 1 ? "" : "s"}
          </p>
        </div>
        {isOwner ? (
          <Badge>This is your channel</Badge>
        ) : (
          <SubscribeButton
            channelId={channel.id}
            initialSubscribed={channel.isSubscribed}
            initialCount={channel.subscriberCount}
          />
        )}
      </div>

      <h2 className="mb-4 border-b pb-2 font-medium">Videos</h2>
      {videos?.docs.length ? (
        <>
          <VideoGrid videos={videos.docs} hideChannel />
          <Pagination
            page={page}
            totalPages={videos.totalPages}
            href={(p) => `/c/${channel.username}?page=${p}`}
          />
        </>
      ) : (
        <EmptyState title="No videos yet" description={isOwner ? "Upload your first video from the Upload button." : undefined} />
      )}
    </div>
  );
}
