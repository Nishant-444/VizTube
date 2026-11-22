import { Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/misc";
import type { VideoWithOwner } from "@/lib/api/types";
import { formatCount, formatDuration, secureUrl, timeAgo } from "@/lib/utils";

type ThumbVideo = { title: string; thumbnailUrl: string; duration: number };

/** Inset thumbnail with a duration chip in the corner. */
export function Thumbnail({
  video,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw",
}: {
  video: ThumbVideo;
  sizes?: string;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
      <Image
        src={secureUrl(video.thumbnailUrl)}
        alt=""
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <span className="absolute left-2 top-2 rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-medium text-foreground shadow-xs backdrop-blur">
        {formatDuration(video.duration)}
      </span>
    </div>
  );
}

const aiReady = (v: VideoWithOwner) =>
  v.processingStatus === "COMPLETED" && v.hasTranscript && v.allowPublicQnA;

function Tags({ video, showTime = true }: { video: VideoWithOwner; showTime?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {aiReady(video) && (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          <Sparkles className="size-3" /> Ask AI
        </span>
      )}
      {showTime && (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {timeAgo(video.createdAt)}
        </span>
      )}
    </div>
  );
}

export function VideoCard({ video, hideChannel }: { video: VideoWithOwner; hideChannel?: boolean }) {
  return (
    <article className="group flex flex-col rounded-xl border bg-card p-2 transition-shadow hover:shadow-md">
      <Link href={`/watch/${video.id}`} aria-label={video.title}>
        <Thumbnail video={video} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pb-1 pt-3">
        {/* the footer already shows the date when the channel is hidden */}
        <Tags video={video} showTime={!hideChannel} />
        <Link href={`/watch/${video.id}`} className="flex-1">
          <h3 className="line-clamp-2 font-medium leading-snug">{video.title}</h3>
        </Link>
        <div className="flex items-center justify-between gap-2 pt-1 text-[13px]">
          {hideChannel ? (
            <span className="text-muted-foreground">{timeAgo(video.createdAt)}</span>
          ) : (
            <Link
              href={`/c/${video.user.username}`}
              className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Avatar src={video.user.avatar} alt="" size={20} />
              <span className="truncate">{video.user.fullname}</span>
            </Link>
          )}
          <span className="shrink-0 text-muted-foreground">
            Views: <span className="text-foreground">{formatCount(video.views)}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function VideoGrid({ videos, hideChannel }: { videos: VideoWithOwner[]; hideChannel?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} hideChannel={hideChannel} />
      ))}
    </div>
  );
}

/** Horizontal card used by list view, search results and history. */
export function VideoRow({ video }: { video: VideoWithOwner }) {
  return (
    <article className="group flex flex-col gap-4 rounded-xl border bg-card p-2 transition-shadow hover:shadow-md sm:flex-row">
      <Link href={`/watch/${video.id}`} className="sm:w-72 sm:shrink-0" aria-label={video.title}>
        <Thumbnail video={video} sizes="(max-width: 640px) 100vw, 288px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2 px-1.5 pb-1 sm:py-1.5">
        <Tags video={video} />
        <Link href={`/watch/${video.id}`}>
          <h3 className="line-clamp-2 text-[17px] font-medium leading-snug">{video.title}</h3>
        </Link>
        {video.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{video.description}</p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-1 text-[13px] text-muted-foreground">
          <Link href={`/c/${video.user.username}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Avatar src={video.user.avatar} alt="" size={20} />
            {video.user.fullname}
          </Link>
          <span>
            Views: <span className="text-foreground">{formatCount(video.views)}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function VideoList({ videos }: { videos: VideoWithOwner[] }) {
  return (
    <div className="flex flex-col gap-3">
      {videos.map((v) => (
        <VideoRow key={v.id} video={v} />
      ))}
    </div>
  );
}
