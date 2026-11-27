// Mirrors the Express API's response shapes (apps/api/src/controllers).

export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

export type ProcessingStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface User {
  id: string;
  username: string;
  email: string;
  fullname: string;
  avatar: string;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  username: string;
  fullname: string;
  avatar: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  videoFileUrl: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  isPublished: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  processingStatus: ProcessingStatus;
  hasTranscript: boolean;
  allowPublicQnA: boolean;
}

export interface VideoWithOwner extends Video {
  user: UserSummary;
}

export interface VideoDetail extends Video {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  user: UserSummary & {
    id: string;
    subscribersCount: number;
    isSubscribed: boolean;
  };
}

export interface PagedVideos {
  docs: VideoWithOwner[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FeedPage {
  items: VideoWithOwner[];
  nextCursor: string | null;
}

export interface VideoStatus {
  id: string;
  processingStatus: ProcessingStatus;
  hasTranscript: boolean;
  allowPublicQnA: boolean;
}

export interface Transcript {
  videoId: string;
  content: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  videoId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
  replyCount?: number;
}

export interface ChannelProfile
  extends Omit<User, "email"> {
  email?: string;
  subscriberCount: number;
  channelsSubscribedToCount: number;
  isSubscribed: boolean;
}

export interface ChannelStats {
  totalViews: number;
  totalSubscribers: number;
  totalVideos: number;
  totalLikes: number;
}

export interface StudioVideo extends Video {
  _count: { likes: number };
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  totalVideos: number;
  thumbnail: string | null;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  user: UserSummary;
  videos: VideoWithOwner[];
  totalVideos: number;
  totalViews: number;
}

export interface AskResult {
  answer: string;
  sources: string[];
}
