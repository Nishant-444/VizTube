"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, RotateCw, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Alert, Badge, EmptyState, Skeleton, Spinner } from "@/components/ui/misc";
import { StatusBadge } from "@/components/video/status-badge";
import { api, errorMessage } from "@/lib/api/client";
import type { ChannelStats, StudioVideo } from "@/lib/api/types";
import { formatCount, formatDuration, secureUrl, timeAgo } from "@/lib/utils";

const PAGE_SIZE = 20;

function Stats() {
  const stats = useQuery({
    queryKey: ["studio", "stats"],
    queryFn: () => api<ChannelStats>("/dashboard/stats"),
  });
  const items = [
    { label: "Views", value: stats.data?.totalViews },
    { label: "Subscribers", value: stats.data?.totalSubscribers },
    { label: "Videos", value: stats.data?.totalVideos },
    { label: "Likes", value: stats.data?.totalLikes },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{i.label}</p>
          {i.value === undefined ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold">{formatCount(i.value)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function EditForm({ video, onDone }: { video: StudioVideo; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const save = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description);
      return api(`/videos/${video.id}`, { method: "PATCH", body: form });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["studio"] });
      onDone();
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) save.mutate();
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" maxLength={100} autoFocus />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" rows={3} />
      {save.isError && <Alert>{errorMessage(save.error)}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="primary" disabled={save.isPending || !title.trim()}>
          {save.isPending && <Spinner />} Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function VideoRow({ video }: { video: StudioVideo }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["studio"] });

  const togglePublish = useMutation({
    mutationFn: () => api(`/videos/toggle/publish/${video.id}`, { method: "PATCH" }),
    onSuccess: refresh,
  });
  const reprocess = useMutation({
    mutationFn: () => api(`/videos/${video.id}/reprocess`, { method: "POST" }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => api(`/videos/${video.id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });
  const error = togglePublish.error ?? reprocess.error ?? remove.error;

  return (
    <li className="flex flex-col gap-4 border-b py-4 sm:flex-row">
      <Link href={`/watch/${video.id}`} className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-44">
        <Image src={secureUrl(video.thumbnailUrl)} alt="" fill sizes="176px" className="object-cover" />
        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-xs text-white">
          {formatDuration(video.duration)}
        </span>
      </Link>
      <div className="min-w-0 flex-1">
        {editing ? (
          <EditForm video={video} onDone={() => setEditing(false)} />
        ) : (
          <>
            <Link href={`/watch/${video.id}`} className="line-clamp-1 font-medium hover:underline">
              {video.title}
            </Link>
            <p className="line-clamp-1 text-sm text-muted-foreground">{video.description || "No description"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {video.isPublished ? <Badge>Public</Badge> : <Badge tone="warning">Unpublished</Badge>}
              <StatusBadge status={video.processingStatus} hasTranscript={video.hasTranscript} />
              <span>
                {formatCount(video.views)} views · {formatCount(video._count.likes)} likes · {timeAgo(video.createdAt)}
              </span>
            </div>
          </>
        )}
        {error && (
          <div className="mt-2">
            <Alert>{errorMessage(error)}</Alert>
          </div>
        )}
      </div>
      {!editing && (
        <div className="flex shrink-0 flex-wrap items-start gap-1">
          {confirmDelete ? (
            <>
              <Button size="sm" variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
                {remove.isPending && <Spinner />} Delete forever
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" aria-label="Edit details" title="Edit details" onClick={() => setEditing(true)}>
                <Pencil />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={video.isPublished ? "Unpublish" : "Publish"}
                title={video.isPublished ? "Unpublish" : "Publish"}
                onClick={() => togglePublish.mutate()}
                disabled={togglePublish.isPending}
              >
                {video.isPublished ? <EyeOff /> : <Eye />}
              </Button>
              {video.processingStatus === "FAILED" && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Retry AI processing"
                  title="Retry AI processing"
                  onClick={() => reprocess.mutate()}
                  disabled={reprocess.isPending}
                >
                  <RotateCw />
                </Button>
              )}
              <Button size="icon" variant="ghost" aria-label="Delete video" title="Delete video" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export function Studio() {
  const [page, setPage] = useState(1);
  const videos = useQuery({
    queryKey: ["studio", "videos", page],
    queryFn: () => api<{ videos: StudioVideo[]; totalVideos: number }>(`/dashboard/videos?page=${page}&limit=${PAGE_SIZE}`),
    // keep badges live while any video is still being processed
    refetchInterval: (q) => (q.state.data?.videos.some((v) => v.processingStatus === "PROCESSING") ? 4000 : false),
  });
  const totalPages = Math.ceil((videos.data?.totalVideos ?? 0) / PAGE_SIZE);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Studio</h1>
        <Link href="/upload" className={buttonVariants({ variant: "primary" })}>
          <Upload /> Upload
        </Link>
      </div>
      <Stats />
      <section>
        <h2 className="mb-2 text-lg font-semibold">Your videos</h2>
        {videos.isLoading && <Spinner />}
        {videos.isError && <Alert>{errorMessage(videos.error)}</Alert>}
        {videos.data?.videos.length === 0 && (
          <EmptyState title="No videos yet" description="Videos you upload will appear here.">
            <Link href="/upload" className={buttonVariants({ variant: "inverted", className: "mt-2" })}>
              Upload a video
            </Link>
          </EmptyState>
        )}
        <ul>
          {videos.data?.videos.map((v) => (
            <VideoRow key={v.id} video={v} />
          ))}
        </ul>
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
