"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Film, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/misc";
import { StatusBadge } from "@/components/video/status-badge";
import { api, errorMessage, uploadWithProgress } from "@/lib/api/client";
import type { Video, VideoStatus } from "@/lib/api/types";
import { imageFileError, MAX_VIDEO_MB, VIDEO_TYPES } from "@/lib/validation";

const videoFileError = (file: File | null) => {
  if (!file) return undefined;
  if (!VIDEO_TYPES.includes(file.type)) return "Use an MP4, WEBM, MKV or MOV file";
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) return `Videos must be under ${MAX_VIDEO_MB} MB`;
  return undefined;
};

function FilePicker({
  id,
  label,
  accept,
  file,
  onChange,
  icon: Icon,
  error,
}: {
  id: string;
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  icon: typeof Film;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 hover:bg-muted"
      >
        <Icon className="size-6 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm">
          {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "Choose a file"}
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <FieldError message={error} />
    </div>
  );
}

function ProcessingStatus({ video }: { video: Video }) {
  const status = useQuery({
    queryKey: ["video-status", video.id],
    queryFn: () => api<VideoStatus>(`/videos/${video.id}/status`),
    refetchInterval: (q) => (q.state.data?.processingStatus === "COMPLETED" || q.state.data?.processingStatus === "FAILED" ? false : 3000),
  });
  const s = status.data;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border p-8 text-center">
      <CheckCircle2 className="size-10 text-emerald-500" />
      <div>
        <p className="text-lg font-semibold">&ldquo;{video.title}&rdquo; is published</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {s?.processingStatus === "COMPLETED"
            ? s.hasTranscript
              ? "AI processing finished. Viewers can now ask questions about it."
              : "AI processing finished, but no speech was found, so Q&A isn’t available for this video."
            : s?.processingStatus === "FAILED"
              ? "AI processing failed. You can retry from the Studio."
              : "We're transcribing it in the background so viewers can ask AI questions. You can leave this page."}
        </p>
      </div>
      {s && <StatusBadge status={s.processingStatus} hasTranscript={s.hasTranscript} />}
      <div className="flex gap-2">
        <Link href={`/watch/${video.id}`} className={buttonVariants({ variant: "inverted" })}>
          Watch video
        </Link>
        <Link href="/studio" className={buttonVariants({ variant: "outline" })}>
          Go to Studio
        </Link>
      </div>
    </div>
  );
}

export function UploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Video | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  const videoError = videoFileError(videoFile);
  const thumbError = imageFileError(thumbnail);
  const uploading = progress !== null;

  // warn before closing the tab mid-upload
  useEffect(() => {
    if (!uploading) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  if (uploaded) return <ProcessingStatus video={uploaded} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!title.trim() || !videoFile || !thumbnail || videoError || thumbError) return;

    setError(null);
    setProgress(0);
    const form = new FormData();
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("videoFile", videoFile);
    form.append("thumbnail", thumbnail);

    const { promise, abort } = uploadWithProgress<{ video: Video }>("/videos", form, setProgress);
    abortRef.current = abort;
    try {
      const data = await promise;
      setUploaded(data.video);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  };

  const pct = Math.round((progress ?? 0) * 100);

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} disabled={uploading} />
        <FieldError message={submitted && !title.trim() ? "Add a title" : undefined} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={uploading}
          placeholder="Tell viewers about your video. This also helps the AI answer questions."
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FilePicker
          id="videoFile"
          label={`Video (max ${MAX_VIDEO_MB} MB)`}
          accept={VIDEO_TYPES.join(",")}
          file={videoFile}
          onChange={setVideoFile}
          icon={Film}
          error={videoError ?? (submitted && !videoFile ? "Choose a video" : undefined)}
        />
        <FilePicker
          id="thumbnail"
          label="Thumbnail"
          accept="image/jpeg,image/png,image/webp"
          file={thumbnail}
          onChange={setThumbnail}
          icon={ImageIcon}
          error={thumbError ?? (submitted && !thumbnail ? "Choose a thumbnail" : undefined)}
        />
      </div>

      {uploading && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload progress"
          >
            <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">
            {pct < 100 ? `Uploading… ${pct}%` : "Processing on the server…"}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {uploading && (
          <Button type="button" variant="ghost" onClick={() => abortRef.current?.()}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" size="lg" disabled={uploading}>
          {uploading ? "Uploading…" : "Publish"}
        </Button>
      </div>
    </form>
  );
}
