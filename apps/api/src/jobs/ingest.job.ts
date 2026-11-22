import type { Job } from 'pg-boss';
import { boss } from '../lib/queue.js';
import { prisma } from '../lib/prisma.js';
import { ProcessingStatus } from '../generated/client/enums.js';
import { AiWorkerError, ingest } from '../services/ai.service.js';
import { getAudioUrl } from '../utils/cloudinary.js';

const QUEUE = 'video-ingest';
const RETRY_LIMIT = 3;

interface IngestJobData {
  videoId: string;
}

const markFailed = (videoId: string) =>
  prisma.video
    .updateMany({
      where: { id: videoId },
      data: {
        processingStatus: ProcessingStatus.FAILED,
        hasTranscript: false,
        allowPublicQnA: false,
      },
    })
    .catch((e) => console.error(`[Ingest] could not mark ${videoId} FAILED`, e));

const processIngestJob = async (job: Job<IngestJobData>) => {
  const { videoId } = job.data;
  const attempt = job.retryCount + 1;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { videoFilePublicId: true },
  });

  // deleted while queued: nothing to do
  if (!video) return;

  console.log(`[Ingest] ${videoId}: attempt ${attempt}/${RETRY_LIMIT + 1}`);

  try {
    const result = await ingest(
      videoId,
      getAudioUrl(video.videoFilePublicId),
      job.signal
    );
    const transcript = result.transcript?.trim() ?? '';

    // upsert, not create: a retry may follow an attempt that already saved one
    await prisma.$transaction([
      transcript
        ? prisma.transcript.upsert({
            where: { videoId },
            create: { videoId, content: transcript },
            update: { content: transcript },
          })
        : prisma.transcript.deleteMany({ where: { videoId } }),
      prisma.video.updateMany({
        where: { id: videoId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          hasTranscript: transcript.length > 0,
          allowPublicQnA: true,
        },
      }),
    ]);

    console.log(
      `[Ingest] ${videoId}: completed (${result.chunks_processed} chunks)`
    );
  } catch (error) {
    const permanent = error instanceof AiWorkerError && !error.retryable;
    const lastAttempt = job.retryCount >= RETRY_LIMIT;
    const reason = error instanceof Error ? error.message : String(error);

    if (permanent || lastAttempt) {
      console.error(`[Ingest] ${videoId}: failed for good: ${reason}`);
      await markFailed(videoId);
      // a permanent error is settled here; returning completes the job without retrying
      if (permanent) return;
    } else {
      console.warn(`[Ingest] ${videoId}: attempt ${attempt} failed, will retry: ${reason}`);
    }
    throw error;
  }
};

/** Create the queue (idempotent) and start processing ingest jobs. */
export const setupIngestQueue = async () => {
  await boss.createQueue(QUEUE, {
    // at most one queued + one active job per video (keyed by singletonKey)
    policy: 'stately',
    retryLimit: RETRY_LIMIT,
    retryDelay: 30,
    retryBackoff: true,
    retryDelayMax: 600,
    expireInSeconds: 30 * 60,
    // jobs held by a crashed process are retried once heartbeats stop
    heartbeatSeconds: 30,
  });

  await boss.work<IngestJobData>(QUEUE, async ([job]) => {
    if (job) await processIngestJob(job);
  });
};

/** Queue a video for transcription + embedding. */
export const enqueueIngest = async (videoId: string) => {
  const jobId = await boss.send(QUEUE, { videoId }, { singletonKey: videoId });
  if (!jobId) {
    console.warn(`[Ingest] ${videoId}: a job is already queued, skipped`);
  }
  return jobId;
};
