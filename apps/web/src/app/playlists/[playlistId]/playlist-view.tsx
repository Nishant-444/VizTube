"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, Spinner } from "@/components/ui/misc";
import { Thumbnail } from "@/components/video/video-card";
import { api, errorMessage } from "@/lib/api/client";
import type { PlaylistDetail } from "@/lib/api/types";
import { formatViews, timeAgo } from "@/lib/utils";

export function PlaylistView({ playlistId }: { playlistId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const playlist = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: () => api<PlaylistDetail>(`/playlist/${playlistId}`),
  });
  const removeVideo = useMutation({
    mutationFn: (videoId: string) => api(`/playlist/${playlistId}/${videoId}`, { method: "DELETE" }),
    // drop the row right away; the refetch below confirms it
    onMutate: (videoId: string) => {
      queryClient.setQueryData<PlaylistDetail>(["playlist", playlistId], (p) =>
        p ? { ...p, videos: p.videos.filter((v) => v.id !== videoId), totalVideos: p.totalVideos - 1 } : p,
      );
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
  const deletePlaylist = useMutation({
    mutationFn: () => api(`/playlist/${playlistId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
      router.push("/playlists");
    },
  });

  if (playlist.isLoading) return <Spinner />;
  if (playlist.isError) return <Alert>{errorMessage(playlist.error)}</Alert>;
  const p = playlist.data!;
  const isOwner = user?.id === p.userId;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-muted p-6">
        <div>
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            {p.user.fullname} · {p.totalVideos} video{p.totalVideos === 1 ? "" : "s"} · {formatViews(p.totalViews)}
          </p>
        </div>
        {isOwner &&
          (confirmDelete ? (
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => deletePlaylist.mutate()} disabled={deletePlaylist.isPending}>
                Delete playlist
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete
            </Button>
          ))}
      </div>
      {(removeVideo.error || deletePlaylist.error) && (
        <Alert>{errorMessage(removeVideo.error ?? deletePlaylist.error)}</Alert>
      )}
      {p.videos.length === 0 ? (
        <EmptyState title="This playlist is empty" description="Use Save on any video to add it here." />
      ) : (
        <ol className="flex flex-col gap-3">
          {p.videos.map((v, i) => (
            <li key={v.id} className="flex items-center gap-3">
              <span className="w-6 text-center text-sm text-muted-foreground">{i + 1}</span>
              <Link href={`/watch/${v.id}`} className="group flex min-w-0 flex-1 gap-3">
                <div className="w-40 shrink-0">
                  <Thumbnail video={v} sizes="160px" />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 font-medium">{v.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {v.user.fullname} · {formatViews(v.views)} · {timeAgo(v.createdAt)}
                  </p>
                </div>
              </Link>
              {isOwner && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${v.title} from playlist`}
                  onClick={() => removeVideo.mutate(v.id)}
                  disabled={removeVideo.isPending}
                >
                  <X />
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
