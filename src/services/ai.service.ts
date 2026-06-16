// src/services/ai.service.ts
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const AI_WORKER_URL = process.env.AI_WORKER_URL || 'http://localhost:8000';

export const ingestVideoForAI = async (videoId: string, filePath: string) => {
  const formData = new FormData();
  formData.append('video_id', videoId);

  // Create a read stream from the saved Multer disk file
  formData.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    `${AI_WORKER_URL}/api/rag/ingest`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
      },
    }
  );

  return response.data;
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
    video_description: metadata.description,
  });
  return response.data;
};
