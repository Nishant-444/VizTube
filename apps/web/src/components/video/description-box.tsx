"use client";

import { useState } from "react";
import { formatViews, timeAgo } from "@/lib/utils";

export function DescriptionBox({ views, createdAt, description }: { views: number; createdAt: string; description: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const text = description?.trim();
  const long = (text?.length ?? 0) > 180 || (text?.split("\n").length ?? 0) > 3;

  return (
    <div className="rounded-xl bg-muted p-3 text-sm">
      <p className="font-medium">
        {formatViews(views)} · {timeAgo(createdAt)}
      </p>
      {text ? (
        <p className={`mt-1 whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}>{text}</p>
      ) : (
        <p className="mt-1 text-muted-foreground">No description.</p>
      )}
      {long && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-1 font-medium">
          {expanded ? "Show less" : "...more"}
        </button>
      )}
    </div>
  );
}
