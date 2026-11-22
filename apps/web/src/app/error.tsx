"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-xl font-semibold">Something went wrong</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "The server could not complete this request."}
      </p>
      <Button variant="inverted" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
