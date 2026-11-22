"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ListPlus, Share2, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth, useRequireAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import type { PlaylistSummary } from "@/lib/api/types";
import { formatCount } from "@/lib/utils";

function LikeButton({ videoId, initialLiked, initialCount }: { videoId: string; initialLiked: boolean; initialCount: number }) {
  const requireAuth = useRequireAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const toggle = () =>
    requireAuth(async () => {
      const next = !liked;
      setLiked(next);
      setCount((c) => c + (next ? 1 : -1));
      setPending(true);
      try {
        await api(`/likes/toggle/v/${videoId}`, { method: "POST" });
      } catch {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      } finally {
        setPending(false);
      }
    });

  return (
    <Button onClick={toggle} disabled={pending} aria-pressed={liked}>
      <ThumbsUp className={liked ? "fill-current" : undefined} />
      {formatCount(count)}
    </Button>
  );
}

function SaveMenu({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const playlists = useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: () => api<PlaylistSummary[]>(`/playlist/user/${user!.id}`),
    enabled: open && !!user,
  });

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const add = async (playlistId: string) => {
    setStatus(null);
    try {
      await api(`/playlist/${playlistId}/${videoId}`, { method: "POST" });
      setSaved((s) => new Set(s).add(playlistId));
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
    } catch (e) {
      setStatus(errorMessage(e));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => requireAuth(() => setOpen((o) => !o))} aria-expanded={open}>
        <ListPlus /> Save
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border bg-card p-2 shadow-lg">
          <p className="px-2 pb-2 text-sm font-medium">Save to playlist</p>
          {playlists.isLoading && <Spinner className="m-2" />}
          {playlists.data?.length === 0 && (
            <p className="px-2 pb-2 text-sm text-muted-foreground">
              No playlists yet. Create one on the Playlists page.
            </p>
          )}
          {playlists.data?.map((p) => (
            <button
              key={p.id}
              onClick={() => void add(p.id)}
              disabled={saved.has(p.id)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-muted disabled:opacity-70"
            >
              <span className="truncate">{p.name}</span>
              {saved.has(p.id) && <Check className="size-4" />}
            </button>
          ))}
          {status && <p className="px-2 pt-1 text-xs text-destructive">{status}</p>}
        </div>
      )}
    </div>
  );
}

function ShareButton() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const share = async () => {
    const url = window.location.href;
    try {
      // the Clipboard API can reject (no focus, no permission) or never
      // settle while a permission prompt is pending, so cap the wait
      await Promise.race([
        navigator.clipboard.writeText(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500)),
      ]);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 4000);
  };

  return (
    <div className="relative">
      <Button onClick={() => void share()} aria-live="polite">
        {state === "copied" ? <Check /> : <Share2 />} {state === "copied" ? "Copied" : "Share"}
      </Button>
      {state === "failed" && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border bg-card p-3 shadow-lg">
          <p className="mb-2 text-xs text-muted-foreground">Couldn&apos;t copy automatically. Copy this link:</p>
          <input
            readOnly
            value={typeof window === "undefined" ? "" : window.location.href}
            onFocus={(e) => e.currentTarget.select()}
            autoFocus
            aria-label="Video link"
            className="w-full rounded-lg border bg-background px-2 py-1 text-xs"
          />
        </div>
      )}
    </div>
  );
}

export function VideoActions({ videoId, isLiked, likesCount }: { videoId: string; isLiked: boolean; likesCount: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      <LikeButton videoId={videoId} initialLiked={isLiked} initialCount={likesCount} />
      <ShareButton />
      <SaveMenu videoId={videoId} />
    </div>
  );
}
