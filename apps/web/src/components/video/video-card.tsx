import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/misc";
import type { VideoWithOwner } from "@/lib/api/types";
import { formatDuration, formatViews, secureUrl, timeAgo } from "@/lib/utils";

export function Thumbnail({
  video,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw",
}: {
  video: { title: string; thumbnailUrl: string; duration: number };
  sizes?: string;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
      <Image
        src={secureUrl(video.thumbnailUrl)}
        alt=""
        fill
        sizes={sizes}
        className="object-cover transition-transform group-hover:scale-[1.02]"
      />
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
        {formatDuration(video.duration)}
      </span>
    </div>
  );
}

export function VideoCard({ video, hideChannel }: { video: VideoWithOwner; hideChannel?: boolean }) {
  return (
    <div className="group flex flex-col gap-3">
      <Link href={`/watch/${video.id}`} aria-label={video.title}>
        <Thumbnail video={video} />
      </Link>
      <div className="flex gap-3">
        {!hideChannel && (
          <Link href={`/c/${video.user.username}`} className="shrink-0">
            <Avatar src={video.user.avatar} alt={video.user.fullname} />
          </Link>
        )}
        <div className="min-w-0">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 font-medium leading-snug">{video.title}</h3>
          </Link>
          {!hideChannel && (
            <Link
              href={`/c/${video.user.username}`}
              className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
            >
              {video.user.fullname}
            </Link>
          )}
          <p className="text-sm text-muted-foreground">
            {formatViews(video.views)} · {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function VideoGrid({
  videos,
  hideChannel,
}: {
  videos: VideoWithOwner[];
  hideChannel?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} hideChannel={hideChannel} />
      ))}
    </div>
  );
}

/** Horizontal row layout used by search results and lists. */
export function VideoRow({ video }: { video: VideoWithOwner }) {
  return (
    <div className="group flex flex-col gap-4 sm:flex-row">
      <Link href={`/watch/${video.id}`} className="sm:w-80 sm:shrink-0" aria-label={video.title}>
        <Thumbnail video={video} sizes="(max-width: 640px) 100vw, 320px" />
      </Link>
      <div className="min-w-0">
        <Link href={`/watch/${video.id}`}>
          <h3 className="line-clamp-2 text-lg font-medium">{video.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">
          {formatViews(video.views)} · {timeAgo(video.createdAt)}
        </p>
        <Link
          href={`/c/${video.user.username}`}
          className="my-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Avatar src={video.user.avatar} alt={video.user.fullname} size={24} />
          {video.user.fullname}
        </Link>
        {video.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{video.description}</p>
        )}
      </div>
    </div>
  );
}
