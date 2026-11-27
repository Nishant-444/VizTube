import { Eye, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/misc";
import type { VideoWithOwner } from "@/lib/api/types";
import { formatCount, formatDuration, formatViews, secureUrl, timeAgo } from "@/lib/utils";

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

function ViewCount({ views }: { views: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-muted-foreground" aria-label={formatViews(views)}>
      <Eye className="size-3.5" aria-hidden="true" />
      <span className="text-foreground">{formatCount(views)}</span>
    </span>
  );
}

function Tags({ video }: { video: VideoWithOwner }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {timeAgo(video.createdAt)}
      </span>
      {aiReady(video) && (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          <Sparkles className="size-3" /> Ask AI
        </span>
      )}
    </div>
  );
}

/**
 * Tile: thumbnail, title, then channel + view count on one row, then tags.
 * `hideChannel` (channel page) puts the view count next to the tags instead.
 */
export function VideoCard({ video, hideChannel }: { video: VideoWithOwner; hideChannel?: boolean }) {
  return (
    <article className="group flex flex-col rounded-xl border bg-card p-2 transition-shadow hover:shadow-md">
      <Link href={`/watch/${video.id}`} aria-label={video.title}>
        <Thumbnail video={video} />
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 px-1.5 pb-1 pt-3">
        <Link href={`/watch/${video.id}`}>
          <h3 className="line-clamp-2 font-medium leading-snug">{video.title}</h3>
        </Link>

        {hideChannel ? (
          <div className="mt-auto flex items-center justify-between gap-2 text-[13px]">
            <Tags video={video} />
            <ViewCount views={video.views} />
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <Link
                href={`/c/${video.user.username}`}
                className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Avatar src={video.user.avatar} alt="" size={22} />
                <span className="truncate">{video.user.fullname}</span>
              </Link>
              <ViewCount views={video.views} />
            </div>
            <Tags video={video} />
          </div>
        )}
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
