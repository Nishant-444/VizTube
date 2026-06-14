import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { prisma } from '../lib/prisma.js';

export const triggerBackgroundIngestion = async (
  videoId: string,
  filePath: string
) => {
  const AI_WORKER_URL =
    process.env.AI_WORKER_URL || 'http://localhost:8000/api/rag/ingest';

  try {
    const form = new FormData();
    form.append('video_id', `vid_${videoId}`);
    form.append('file', fs.createReadStream(filePath));

    // Capture the response from Python
    const response = await axios.post(AI_WORKER_URL, form, {
      headers: { ...form.getHeaders() },
    });

    // Save the transcript to Postgres if Python returned it
    if (response.data.transcript) {
      await prisma.transcript.create({
        data: {
          videoId: videoId,
          content: response.data.transcript,
        },
      });

      // Mark the video as having a transcript
      await prisma.video.update({
        where: { id: videoId },
        data: { hasTranscript: true },
      });
    }

    console.log(`✅ Background AI ingestion completed for video: ${videoId}`);
  } catch (error: any) {
    console.error(
      `❌ Background AI ingestion failed for video ${videoId}:`,
      error.message
    );
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};
