import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { prisma } from '../lib/prisma.js'; // Ensure this path matches your setup
import { ApiError } from './ApiError.js';

const AI_WORKER_BASE_URL = process.env.AI_WORKER_URL || 'http://localhost:8000';

export const triggerBackgroundIngestion = async (
  videoId: string,
  filePath: string
) => {
  try {
    const form = new FormData();
    // Pass the raw Prisma UUID
    form.append('video_id', videoId);
    form.append('file', fs.createReadStream(filePath));

    // Capture the response from Python (Fixed routing to match /api/rag/ingest)
    const response = await axios.post(
      `${AI_WORKER_BASE_URL}/api/rag/ingest`,
      form,
      {
        headers: { ...form.getHeaders() },
      }
    );

    let transcriptExtracted = false;

    // If Python sends the raw transcript back AND it's not empty, save it
    if (response.data.transcript && response.data.transcript.length > 0) {
      await prisma.transcript.create({
        data: { videoId: videoId, content: response.data.transcript },
      });
      transcriptExtracted = true; // The AI actually found words!
    }

    // THE SWITCH FLIP
    await prisma.video.update({
      where: { id: videoId },
      data: {
        processingStatus: 'COMPLETED',
        hasTranscript: transcriptExtracted,
        allowPublicQnA: true,
      },
    });

    console.log(
      `✅ Background AI ingestion completed and DB updated for video: ${videoId}`
    );
  } catch (error: any) {
    if (error instanceof AggregateError) {
      error.errors.forEach((e: any) => console.error('Inner Error:', e));
    } else {
      console.error('Caught Error:', error);
    }

    // FAILURE STATE: Tell the UI to stop spinning and show an error
    await prisma.video
      .update({
        where: { id: videoId },
        data: {
          processingStatus: 'FAILED',
          hasTranscript: false,
          allowPublicQnA: false,
        },
      })
      .catch((e) =>
        console.error('[DB Error] Failed to update failure state', e)
      );
    throw new ApiError(500, error?.message || 'AI Processing failed');
  } finally {
    // THE AI JANITOR
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[AI Janitor] Deleted background video file: ${filePath}`);
      } catch (e) {
        console.error(`[Fatal Cleanup] Could not delete ${filePath}`, e);
      }
    }
  }
};
