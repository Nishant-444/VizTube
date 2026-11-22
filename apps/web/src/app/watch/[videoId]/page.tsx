import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AiPanel } from "@/components/ai/ai-panel";
import { CommentsSection } from "@/components/comments/comments-section";
import { DescriptionBox } from "@/components/video/description-box";
import { SubscribeButton } from "@/components/video/subscribe-button";
import { VideoActions } from "@/components/video/video-actions";
import { VideoPlayer } from "@/components/video/video-player";
import { Thumbnail } from "@/components/video/video-card";
import { Avatar, Badge } from "@/components/ui/misc";
import { serverApi } from "@/lib/api/server";
import type { PagedVideos, VideoDetail } from "@/lib/api/types";
import { formatCount, formatViews, secureUrl, timeAgo } from "@/lib/utils";

// generateMetadata and the page share one request per render
const getVideo = cache((id: string) => serverApi<VideoDetail>(`/videos/${encodeURIComponent(id)}`));

export async function generateMetadata({ params }: PageProps<"/watch/[videoId]">): Promise<Metadata> {
  const { videoId } = await params;
  const video = await getVideo(videoId);
  if (!video) return { title: "Video not found" };

  const description = video.description?.slice(0, 200) || `Watch ${video.title} by ${video.user.fullname} on VizTube`;
  const thumbnail = secureUrl(video.thumbnailUrl);
  return {
    title: video.title,
    description,
    openGraph: {
      type: "video.other",
      title: video.title,
      description,
      images: [{ url: thumbnail, width: 1280, height: 720, alt: video.title }],
      videos: [{ url: secureUrl(video.videoFileUrl) }],
    },
    twitter: { card: "summary_large_image", title: video.title, description, images: [thumbnail] },
  };
}

async function UpNext({ currentId }: { currentId: string }) {
  const data = await serverApi<PagedVideos>("/videos?limit=12&sortBy=createdAt");
  const videos = data?.docs.filter((v) => v.id !== currentId).slice(0, 10) ?? [];
  if (!videos.length) return null;
  return (
    <section aria-label="More videos" className="flex flex-col gap-3">
      <h2 className="font-semibold">More videos</h2>
      {videos.map((v) => (
        <Link key={v.id} href={`/watch/${v.id}`} className="group flex gap-2">
          <div className="w-40 shrink-0">
            <Thumbnail video={v} sizes="160px" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{v.user.fullname}</p>
            <p className="text-xs text-muted-foreground">
              {formatViews(v.views)} · {timeAgo(v.createdAt)}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}

export default async function WatchPage({ params }: PageProps<"/watch/[videoId]">) {
  const { videoId } = await params;
  const video = await getVideo(videoId);
  if (!video) notFound();

  const aiPanel = (
    <AiPanel
      videoId={video.id}
      ownerId={video.userId}
      initialStatus={{
        id: video.id,
        processingStatus: video.processingStatus,
        hasTranscript: video.hasTranscript,
        allowPublicQnA: video.allowPublicQnA,
      }}
    />
  );

  // one grid: on small screens the AI panel sits between the description and
  // the comments; on xl it moves to the right column
  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:grid-rows-[auto_1fr]">
      <div className="min-w-0 xl:col-start-1 xl:row-start-1">
        <VideoPlayer videoId={video.id} src={video.videoFileUrl} poster={video.thumbnailUrl} />

        <h1 className="mt-3 text-xl font-semibold">{video.title}</h1>
        {!video.isPublished && <Badge tone="warning" className="mt-1">Unpublished: only you can see this</Badge>}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/c/${video.user.username}`}>
              <Avatar src={video.user.avatar} alt={video.user.fullname} size={40} />
            </Link>
            <div className="mr-2">
              <Link href={`/c/${video.user.username}`} className="font-medium">
                {video.user.fullname}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatCount(video.user.subscribersCount)} subscriber
                {video.user.subscribersCount === 1 ? "" : "s"}
              </p>
            </div>
            <SubscribeButton
              channelId={video.user.id}
              initialSubscribed={video.user.isSubscribed}
              initialCount={video.user.subscribersCount}
            />
          </div>
          <VideoActions videoId={video.id} isLiked={video.isLiked} likesCount={video.likesCount} />
        </div>

        <div className="mt-4">
          <DescriptionBox views={video.views} createdAt={video.createdAt} description={video.description} />
        </div>
      </div>

      <div className="xl:col-start-2 xl:row-start-1 xl:self-start">{aiPanel}</div>

      <div className="min-w-0 xl:col-start-1 xl:row-start-2">
        <CommentsSection videoId={video.id} initialCount={video.commentsCount} />
      </div>

      <div className="xl:col-start-2 xl:row-start-2">
        <UpNext currentId={video.id} />
      </div>
    </div>
  );
}
