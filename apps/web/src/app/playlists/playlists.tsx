"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListVideo, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Alert, EmptyState, Spinner } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import type { PlaylistSummary } from "@/lib/api/types";
import { secureUrl, timeAgo } from "@/lib/utils";

function CreatePlaylist({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useMutation({
    mutationFn: () =>
      api("/playlist", { method: "POST", json: { name: name.trim(), description: description.trim() } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
      onDone();
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) create.mutate();
  };
  return (
    <form onSubmit={submit} className="mb-6 flex max-w-xl flex-col gap-2 rounded-xl border p-4">
      <Input placeholder="Playlist name" aria-label="Playlist name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={100} />
      <Textarea placeholder="Description (optional)" aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      {create.isError && <Alert>{errorMessage(create.error)}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={!name.trim() || create.isPending}>
          {create.isPending && <Spinner />} Create
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function Playlists() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const playlists = useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: () => api<PlaylistSummary[]>(`/playlist/user/${user!.id}`),
    enabled: !!user,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Playlists</h1>
        {!creating && (
          <Button variant="inverted" onClick={() => setCreating(true)}>
            <Plus /> New playlist
          </Button>
        )}
      </div>
      {creating && <CreatePlaylist onDone={() => setCreating(false)} />}
      {playlists.isLoading && <Spinner />}
      {playlists.isError && <Alert>{errorMessage(playlists.error)}</Alert>}
      {playlists.data?.length === 0 && !creating && (
        <EmptyState title="No playlists yet" description="Create one, then use Save on any video to add it." />
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {playlists.data?.map((p) => (
          <Link key={p.id} href={`/playlists/${p.id}`} className="group flex flex-col gap-2">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              {p.thumbnail ? (
                <Image src={secureUrl(p.thumbnail)} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
              ) : (
                <ListVideo className="absolute inset-0 m-auto size-10 text-muted-foreground" />
              )}
              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
                <ListVideo className="size-3" /> {p.totalVideos} video{p.totalVideos === 1 ? "" : "s"}
              </span>
            </div>
            <div>
              <p className="font-medium group-hover:underline">{p.name}</p>
              <p className="text-sm text-muted-foreground">Created {timeAgo(p.createdAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
