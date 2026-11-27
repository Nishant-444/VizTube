"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronDown, Copy, FileText, RotateCw, SendHorizonal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { api, errorMessage } from "@/lib/api/client";
import type { AskResult, Transcript, VideoStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { SimpleMarkdown } from "./simple-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  error?: boolean;
}

const SUGGESTIONS = [
  "Summarize this video",
  "What are the key takeaways?",
  "What is discussed at the start?",
];

function Sources({ sources }: { sources: string[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
        {sources.length} transcript excerpt{sources.length === 1 ? "" : "s"} used
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-2">
          {sources.map((s, i) => (
            <li key={i} className="rounded-lg border-l-2 border-primary/50 bg-background p-2 text-xs text-muted-foreground">
              {s.length > 400 ? `${s.slice(0, 400)}…` : s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chat({ videoId }: { videoId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pending]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setPending(true);
    try {
      const res = await api<AskResult>("/rag/query", {
        method: "POST",
        json: { video_id: videoId, question: q },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: errorMessage(e), error: true }]);
    } finally {
      setPending(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  return (
    <div className="flex flex-col">
      <div className="flex max-h-[28rem] min-h-40 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Ask anything about this video. Answers come from its transcript.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void ask(s)}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
              m.role === "user"
                ? "self-end bg-foreground text-background"
                : m.error
                  ? "self-start bg-destructive/10 text-destructive"
                  : "self-start bg-muted",
            )}
          >
            {m.role === "assistant" && !m.error ? (
              <SimpleMarkdown text={m.content} />
            ) : (
              <p className="whitespace-pre-wrap">{m.content}</p>
            )}
            {m.sources && <Sources sources={m.sources} />}
          </div>
        ))}
        {pending && (
          <div className="flex items-center gap-2 self-start rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Spinner /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this video…"
          aria-label="Ask about this video"
          maxLength={500}
          className="h-9 flex-1 rounded-full border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="primary" size="icon" disabled={pending || !input.trim()} aria-label="Send">
          <SendHorizonal />
        </Button>
      </form>
    </div>
  );
}

function TranscriptView({ videoId }: { videoId: string }) {
  const [copied, setCopied] = useState(false);
  const transcript = useQuery({
    queryKey: ["transcript", videoId],
    queryFn: () => api<Transcript>(`/videos/${videoId}/transcript`),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (transcript.isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Spinner /> Loading transcript…
      </div>
    );
  }
  if (transcript.isError) {
    return <p className="p-4 text-sm text-destructive">{errorMessage(transcript.error)}</p>;
  }

  const content = transcript.data?.content.trim() ?? "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch {
      // clipboard can be blocked (insecure origin, permissions); nothing useful to show
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <p className="text-xs text-muted-foreground">
          {content.split(/\s+/).filter(Boolean).length.toLocaleString()} words
        </p>
        <Button variant="ghost" size="sm" onClick={() => void copy()} aria-label="Copy transcript">
          {copied ? <Check className="text-success" /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap p-4 text-sm leading-relaxed">{content}</p>
    </div>
  );
}

type Tab = "ask" | "transcript";

export function AiPanel({ videoId, ownerId, initialStatus }: { videoId: string; ownerId: string; initialStatus: VideoStatus }) {
  const { user, promptSignIn } = useAuth();
  const queryClient = useQueryClient();
  const [reprocessError, setReprocessError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("ask");

  // poll while the background job is running
  const status = useQuery({
    queryKey: ["video-status", videoId],
    queryFn: () => api<VideoStatus>(`/videos/${videoId}/status`),
    initialData: initialStatus,
    refetchInterval: (q) => (q.state.data?.processingStatus === "PROCESSING" ? 4000 : false),
  });

  const reprocess = async () => {
    setReprocessError(null);
    try {
      const next = await api<VideoStatus>(`/videos/${videoId}/reprocess`, { method: "POST" });
      queryClient.setQueryData(["video-status", videoId], next);
    } catch (e) {
      setReprocessError(errorMessage(e));
    }
  };

  const s = status.data;
  const isOwner = user?.id === ownerId;

  let body: React.ReactNode;
  if (s.processingStatus === "PROCESSING") {
    body = (
      <div className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
        <Spinner className="mt-0.5" />
        <p>Transcribing this video so you can ask about it. This usually takes under a minute.</p>
      </div>
    );
  } else if (s.processingStatus === "FAILED") {
    body = (
      <div className="flex flex-col gap-3 p-4 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          AI processing failed for this video, so Q&amp;A isn&apos;t available.
        </p>
        {isOwner && (
          <Button variant="outline" size="sm" className="self-start" onClick={() => void reprocess()}>
            <RotateCw /> Try again
          </Button>
        )}
        {reprocessError && <p className="text-xs text-destructive">{reprocessError}</p>}
      </div>
    );
  } else if (!s.hasTranscript) {
    body = <p className="p-4 text-sm text-muted-foreground">No speech was found in this video, so there&apos;s nothing to ask about.</p>;
  } else if (!s.allowPublicQnA) {
    body = <p className="p-4 text-sm text-muted-foreground">The creator hasn&apos;t enabled Q&amp;A for this video.</p>;
  } else if (!user) {
    body = (
      <p className="p-4 text-sm text-muted-foreground">
        <button
          onClick={() => promptSignIn("Sign in to ask AI questions about this video.")}
          className="font-medium text-foreground underline underline-offset-2"
        >
          Sign in
        </button>{" "}
        to ask AI questions about this video.
      </p>
    );
  } else {
    body = <Chat videoId={videoId} />;
  }

  // the transcript is public: no sign-in or Q&A setting needed to read it
  const showTranscript = tab === "transcript" && s.processingStatus === "COMPLETED" && s.hasTranscript;
  if (tab === "transcript") {
    if (s.processingStatus === "PROCESSING") {
      body = (
        <div className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Spinner className="mt-0.5" />
          <p>The transcript will appear here once this video finishes processing.</p>
        </div>
      );
    } else if (!showTranscript) {
      body = <p className="p-4 text-sm text-muted-foreground">No transcript is available for this video.</p>;
    } else {
      body = <TranscriptView videoId={videoId} />;
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "ask", label: "Ask AI", icon: <Sparkles className="size-4" /> },
    { id: "transcript", label: "Transcript", icon: <FileText className="size-4" /> },
  ];

  return (
    <section aria-label="AI tools for this video" className="overflow-hidden rounded-xl border bg-card">
      <div role="tablist" aria-label="AI panel" className="flex gap-1 border-b px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`ai-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="ai-panel-body"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 pb-2.5 pt-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="ai-panel-body" aria-labelledby={`ai-tab-${tab}`}>
        {body}
      </div>
    </section>
  );
}
