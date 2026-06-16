import fs from 'fs';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ingestVideoForAI, askAiAboutVideo } from '../services/ai.service.js';
import { prisma } from '../lib/prisma.js';

export const handleVideoUpload = asyncHandler(
  async (req: Request, res: Response) => {
    const file = req.file;
    const { title, description } = req.body;

    if (!file) throw new ApiError(400, 'Video file is required');

    try {
      const videoId = `vid_${Date.now()}`;

      // Just call the service. The service now handles its own cleanup.
      const aiResponse = await ingestVideoForAI(videoId, file.path);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { videoId, ai_details: aiResponse },
            'Video ingested'
          )
        );
    } catch (error: any) {
      throw new ApiError(500, error?.message || 'AI Ingestion failed');
    }
    // NO finally block here that deletes the file!
  }
);

export const askVideoQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const { video_id, question } = req.body;
    const videoMeta = await prisma.video.findUnique({
      where: { id: video_id },
      select: { title: true, description: true },
    });

    if (!videoMeta) {
      throw new ApiError(404, 'Video metadata not found in database');
    }

    if (!video_id || !question) {
      throw new ApiError(400, 'Both video_id and question are required');
    }

    try {
      // Call the service that hits your FastAPI /ask endpoint
      const answerData = await askAiAboutVideo(video_id, question, videoMeta);

      return res
        .status(200)
        .json(new ApiResponse(200, answerData, 'AI generated an answer'));
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || 'Failed to retrieve answer from AI Worker'
      );
    }
  }
);
