import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { prisma } from '../lib/prisma.js';
import { getSingleParam } from '../utils/normalize.js';
import axios from 'axios';

export const askVideoQuestion = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);
  const { question } = req.body;

  if (!videoId || !question) {
    throw new ApiError(400, 'Video ID and Question are required');
  }

  // 1. Verify Video and Transcript existence
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { transcript: true },
  });

  if (!video || !video.hasTranscript) {
    throw new ApiError(404, 'Video or transcript not found');
  }

  // 2. Delegate to Python RAG service
  try {
    const AI_WORKER_URL = process.env.AI_WORKER_URL || 'http://localhost:8000';

    // Send request to your FastAPI worker
    const response = await axios.post(`${AI_WORKER_URL}/api/rag/ask`, {
      video_id: `vid_${videoId}`, // Maintain naming consistency
      question: question,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { answer: response.data.answer },
          'AI response generated'
        )
      );
  } catch (error) {
    throw new ApiError(500, 'AI Worker failed to process the question');
  }
});
