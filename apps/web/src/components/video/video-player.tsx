"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api/client";
import { secureUrl } from "@/lib/utils";

const VIEW_AFTER_SECONDS = 10;

/** Native player that records one view after ~10s of actual playback. */
export function VideoPlayer({
  videoId,
  src,
  poster,
}: {
  videoId: string;
  src: string;
  poster: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let watched = 0;
    let last = el.currentTime;
    let sent = false;

    // count real playback time only, not seeking
    const onTime = () => {
      const delta = el.currentTime - last;
      last = el.currentTime;
      if (sent || delta <= 0 || delta > 2) return;
      watched += delta;
      if (watched >= VIEW_AFTER_SECONDS || (el.duration && watched >= el.duration * 0.9)) {
        sent = true;
        void api(`/videos/${videoId}/view`, { method: "POST" }).catch(() => undefined);
      }
    };
    const onSeek = () => {
      last = el.currentTime;
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("seeked", onSeek);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("seeked", onSeek);
    };
  }, [videoId]);

  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <video
        ref={ref}
        src={secureUrl(src)}
        poster={secureUrl(poster)}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full"
      />
    </div>
  );
}
