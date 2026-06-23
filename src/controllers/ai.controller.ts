import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { askAiAboutVideo } from '../services/ai.service.js';
import { prisma } from '../lib/prisma.js';

export const askVideoQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const { video_id, question } = req.body;

    // Validate inputs first, before hitting the DB
    if (!video_id || !question) {
      throw new ApiError(400, 'Both video_id and question are required');
    }

    const videoMeta = await prisma.video.findUnique({
      where: { id: video_id },
      select: {
        title: true,
        description: true,
        hasTranscript: true,
        allowPublicQnA: true,
        processingStatus: true,
      },
    });

    if (!videoMeta) {
      throw new ApiError(404, 'Video not found');
    }

    // Guard: don't hit FastAPI if video isn't ready
    if (videoMeta.processingStatus !== 'COMPLETED') {
      throw new ApiError(
        400,
        `Video is not ready for Q&A. Current status: ${videoMeta.processingStatus}`
      );
    }

    if (!videoMeta.hasTranscript) {
      throw new ApiError(400, 'No transcript available for this video');
    }

    if (!videoMeta.allowPublicQnA) {
      throw new ApiError(403, 'Q&A is not enabled for this video');
    }

    try {
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
