"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, useRequireAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatCount } from "@/lib/utils";

export function SubscribeButton({
  channelId,
  initialSubscribed,
  initialCount,
  showCount = false,
}: {
  channelId: string;
  initialSubscribed: boolean;
  initialCount: number;
  showCount?: boolean;
}) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  if (user?.id === channelId) return null;

  const toggle = () =>
    requireAuth(async () => {
      // optimistic update, rolled back if the request fails
      const next = !subscribed;
      setSubscribed(next);
      setCount((c) => c + (next ? 1 : -1));
      setPending(true);
      try {
        const res = await api<{ subscribed: boolean }>(`/subscriptions/c/${channelId}`, {
          method: "POST",
        });
        if (res.subscribed !== next) {
          setSubscribed(res.subscribed);
          setCount((c) => c + (res.subscribed ? 1 : -1) * 2);
        }
        // re-render server components that show the subscriber count
        router.refresh();
      } catch {
        setSubscribed(!next);
        setCount((c) => c + (next ? -1 : 1));
      } finally {
        setPending(false);
      }
    });

  return (
    <div className="flex items-center gap-3">
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {formatCount(count)} subscriber{count === 1 ? "" : "s"}
        </span>
      )}
      <Button
        variant={subscribed ? "secondary" : "inverted"}
        onClick={toggle}
        disabled={pending}
        aria-pressed={subscribed}
      >
        {subscribed ? "Subscribed" : "Subscribe"}
      </Button>
    </div>
  );
}
