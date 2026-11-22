'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { createContext, use, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Alert, Avatar, Spinner } from '@/components/ui/misc';
import { api, errorMessage } from '@/lib/api/client';
import type { Comment } from '@/lib/api/types';
import { formatCount, timeAgo } from '@/lib/utils';

const PAGE_SIZE = 20;

type Pages = InfiniteData<Comment[], number>;

// lets any comment adjust the heading count after a post or delete
const CountContext = createContext<(delta: number) => void>(() => {});

// shared by top-level comments (key: ["comments", videoId]) and replies
// (key: ["replies", commentId]); both endpoints are page/limit paginated
function usePagedComments(key: string[], path: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) =>
      api<Comment[]>(`${path}?page=${pageParam}&limit=${PAGE_SIZE}`),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.length === PAGE_SIZE ? all.length + 1 : undefined,
    enabled,
  });
}

function CommentForm({
  onSubmit,
  placeholder,
  autoFocus,
  initial = '',
  submitLabel = 'Comment',
  onCancel,
}: {
  onSubmit: (content: string) => Promise<unknown>;
  placeholder: string;
  autoFocus?: boolean;
  initial?: string;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initial);
  const [focused, setFocused] = useState(!!autoFocus || !!initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    setError(null);
    try {
      await onSubmit(content.trim());
      setContent('');
      setFocused(false);
      onCancel?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={focused ? 3 : 1}
        className="min-h-0"
        aria-label={placeholder}
      />
      {error && <Alert>{error}</Alert>}
      {focused && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setContent(initial);
              setFocused(false);
              onCancel?.();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={pending || !content.trim()}
          >
            {pending && <Spinner />} {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

function CommentItem({
  comment,
  videoId,
  isReply,
}: {
  comment: Comment;
  videoId: string;
  isReply?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const adjustCount = use(CountContext);
  const isOwn = user?.id === comment.userId;
  const listKey = isReply
    ? ['replies', comment.parentId!]
    : ['comments', videoId];

  const replies = usePagedComments(
    ['replies', comment.id],
    `/comments/c/${comment.id}/replies`,
    showReplies
  );

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: listKey });
    if (isReply)
      void queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
  };

  const remove = useMutation({
    mutationFn: () => api(`/comments/c/${comment.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      // deleting a comment also deletes its replies
      adjustCount(-(1 + (comment.replyCount ?? 0)));
      refresh();
    },
  });

  const replyCount = comment.replyCount ?? 0;

  return (
    <div className="flex gap-3">
      <Link href={`/c/${comment.user.username}`} className="shrink-0">
        <Avatar
          src={comment.user.avatar}
          alt={comment.user.fullname}
          size={isReply ? 24 : 40}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm">
            <Link href={`/c/${comment.user.username}`} className="font-medium">
              @{comment.user.username}
            </Link>{' '}
            <span className="text-muted-foreground">
              {timeAgo(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && ' (edited)'}
            </span>
          </p>
          {isOwn && !editing && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Comment actions"
                className="rounded-full p-1 hover:bg-muted"
              >
                <MoreVertical className="size-4" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 z-20 w-32 rounded-lg border bg-card py-1 shadow-lg"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      remove.mutate();
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <CommentForm
            initial={comment.content}
            placeholder="Edit comment"
            submitLabel="Save"
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={async (content) => {
              await api(`/comments/c/${comment.id}`, {
                method: 'PATCH',
                json: { content },
              });
              refresh();
            }}
          />
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm">
            {comment.content}
          </p>
        )}

        {!isReply && !editing && (
          <div className="mt-1 flex flex-col items-start gap-2">
            {user && (
              <button
                className="rounded-full px-2 py-1 text-xs font-medium hover:bg-muted"
                onClick={() => setReplying((r) => !r)}
              >
                Reply
              </button>
            )}
            {replying && (
              <div className="flex w-full gap-3">
                <Avatar src={user?.avatar} alt="" size={24} />
                <CommentForm
                  placeholder="Add a reply..."
                  submitLabel="Reply"
                  autoFocus
                  onCancel={() => setReplying(false)}
                  onSubmit={async (content) => {
                    await api(`/comments/${videoId}`, {
                      method: 'POST',
                      json: { content, parentId: comment.id },
                    });
                    adjustCount(1);
                    setShowReplies(true);
                    void queryClient.invalidateQueries({
                      queryKey: ['replies', comment.id],
                    });
                    void queryClient.invalidateQueries({
                      queryKey: ['comments', videoId],
                    });
                  }}
                />
              </div>
            )}
            {replyCount > 0 && (
              <button
                className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-primary hover:bg-primary/10"
                onClick={() => setShowReplies((s) => !s)}
                aria-expanded={showReplies}
              >
                {showReplies ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                {formatCount(replyCount)} repl{replyCount === 1 ? 'y' : 'ies'}
              </button>
            )}
            {showReplies && (
              <div className="flex w-full flex-col gap-4 pt-1">
                {replies.isLoading && <Spinner />}
                {replies.data?.pages.flat().map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    videoId={videoId}
                    isReply
                  />
                ))}
                {replies.hasNextPage && (
                  <button
                    className="self-start text-sm font-medium text-primary"
                    onClick={() => void replies.fetchNextPage()}
                  >
                    Show more replies
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentsSection({
  videoId,
  initialCount,
}: {
  videoId: string;
  initialCount: number;
}) {
  const { user, promptSignIn } = useAuth();
  const queryClient = useQueryClient();
  const comments = usePagedComments(
    ['comments', videoId],
    `/comments/${videoId}`
  );
  const [count, setCount] = useState(initialCount);
  const adjustCount = (delta: number) =>
    setCount((c) => Math.max(0, c + delta));

  const add = async (content: string) => {
    const created = await api<Comment>(`/comments/${videoId}`, {
      method: 'POST',
      json: { content },
    });
    adjustCount(1);
    // show the new comment at the top immediately
    queryClient.setQueryData<Pages>(['comments', videoId], (data) =>
      data
        ? {
            ...data,
            pages: [
              [{ ...created, replyCount: 0 }, ...data.pages[0]],
              ...data.pages.slice(1),
            ],
          }
        : data
    );
  };

  const all = comments.data?.pages.flat() ?? [];

  return (
    <CountContext value={adjustCount}>
      <section aria-labelledby="comments-heading" className="mt-6">
        <h2 id="comments-heading" className="mb-4 text-lg font-semibold">
          {formatCount(count)} Comment{count === 1 ? '' : 's'}
        </h2>

        {user ? (
          <div className="mb-6 flex gap-3">
            <Avatar src={user.avatar} alt={user.fullname} size={40} />
            <CommentForm placeholder="Add a comment..." onSubmit={add} />
          </div>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">
            <button
              onClick={() => promptSignIn("Sign in to comment on videos.")}
              className="font-medium text-foreground underline underline-offset-2"
            >
              Sign in
            </button>{' '}
            to join the conversation.
          </p>
        )}

        {comments.isLoading && <Spinner />}
        {comments.isError && <Alert>{errorMessage(comments.error)}</Alert>}
        <div className="flex flex-col gap-6">
          {all.map((c) => (
            <CommentItem key={c.id} comment={c} videoId={videoId} />
          ))}
        </div>
        {comments.hasNextPage && (
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => void comments.fetchNextPage()}
            disabled={comments.isFetchingNextPage}
          >
            {comments.isFetchingNextPage && <Spinner />} Load more comments
          </Button>
        )}
      </section>
    </CountContext>
  );
}
