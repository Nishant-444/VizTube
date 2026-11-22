import axios, { AxiosError } from 'axios';
import { ApiError } from '../utils/ApiError.js';

const AI_WORKER_URL = process.env.AI_WORKER_URL || 'http://localhost:8000';

const worker = axios.create({ baseURL: AI_WORKER_URL });

const INGEST_TIMEOUT_MS = 10 * 60 * 1000;
const ASK_TIMEOUT_MS = 60 * 1000;
const HEALTH_TIMEOUT_MS = 3 * 1000;

/**
 * A failed call to the AI worker. `retryable` is false when the worker says
 * the input itself is bad (e.g. audio too large), so retrying can't help.
 */
export class AiWorkerError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = 'AiWorkerError';
  }
}

const RETRYABLE_CLIENT_STATUSES = new Set([408, 429]);

const toWorkerError = (error: unknown): AiWorkerError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const detail = error.response?.data?.detail;
    const message =
      typeof detail === 'string' ? detail : error.message || 'AI worker request failed';

    // no response (timeout, connection refused) or a 5xx: worth retrying
    const retryable =
      status === null || status >= 500 || RETRYABLE_CLIENT_STATUSES.has(status);

    return new AiWorkerError(message, status, retryable);
  }
  return new AiWorkerError(
    error instanceof Error ? error.message : 'AI worker request failed',
    null,
    true
  );
};

export interface IngestResult {
  status: string;
  video_id: string;
  chunks_processed: number;
  transcript: string;
}

export interface AskResult {
  answer: string;
  sources: string[];
}

/** Transcribe and embed a video's audio. Throws AiWorkerError on failure. */
export const ingest = async (
  videoId: string,
  audioUrl: string,
  signal?: AbortSignal
): Promise<IngestResult> => {
  try {
    const { data } = await worker.post<IngestResult>(
      '/api/rag/ingest',
      { video_id: videoId, audio_url: audioUrl },
      { timeout: INGEST_TIMEOUT_MS, signal }
    );
    return data;
  } catch (error) {
    throw toWorkerError(error);
  }
};

/** Answer a question about a video. Throws ApiError(502) if the worker fails. */
export const ask = async (
  videoId: string,
  question: string,
  metadata: { title: string; description?: string | null }
): Promise<AskResult> => {
  try {
    const { data } = await worker.post<AskResult>(
      '/api/rag/ask',
      {
        video_id: videoId,
        question,
        video_title: metadata.title,
        video_description: metadata.description || '',
      },
      { timeout: ASK_TIMEOUT_MS }
    );
    return data;
  } catch (error) {
    // upstream errors can include provider account details: log them, don't return them
    const workerError = toWorkerError(error);
    console.error(`[AI] ask failed for ${videoId}:`, workerError.message);
    throw new ApiError(
      502,
      'The AI service could not answer right now. Please try again shortly.'
    );
  }
};

/** True when the worker answers its health route. */
export const isWorkerHealthy = async (): Promise<boolean> => {
  try {
    await worker.get('/', { timeout: HEALTH_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
};
