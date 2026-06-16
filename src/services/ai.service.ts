// src/services/ai.service.ts
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const AI_WORKER_URL = process.env.AI_WORKER_URL || 'http://ai-worker:8000';

export const ingestVideoForAI = async (videoId: string, filePath: string) => {
  const formData = new FormData();
  formData.append('video_id', videoId);
  formData.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post(
      `${AI_WORKER_URL}/api/rag/ingest`,
      formData,
      {
        headers: { ...formData.getHeaders() },
        timeout: 120000,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`[AI Ingestion Error] Failed for ${videoId}:`, error);
    throw error; // Re-throw so the controller knows it failed
  } finally {
    // THE JANITOR: Clean up happens here, AFTER the request finishes (success or failure)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[AI Janitor] Successfully cleaned up: ${filePath}`);
    }
  }
};

export const askAiAboutVideo = async (
  videoId: string,
  question: string,
  metadata: any
) => {
  const response = await axios.post(`${AI_WORKER_URL}/api/rag/ask`, {
    video_id: videoId,
    question: question,
    video_title: metadata.title,
    video_description: metadata?.description || '',
  });
  return response.data;
};
