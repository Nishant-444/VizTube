import fs from 'fs';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js'; // Assuming you have a standard response formatter
import { ingestVideoForAI, askAiAboutVideo } from '../services/ai.service.js';
import { prisma } from '../lib/prisma.js';

export const handleVideoUpload = asyncHandler(
  async (req: Request, res: Response) => {
    const file = req.file;
    const { title, description } = req.body;

    const userId = (req as any).user?._id;

    if (!file) {
      throw new ApiError(400, 'Video file is required for processing');
    }

    if (!title) {
      fs.unlinkSync(file.path);
      throw new ApiError(400, 'Video title is required');
    }

    let videoRecord;

    try {
      // 2. Save Initial Metadata to Node.js Database
      // We do this first so we have a reliable videoId to send to Python
      /*
        videoRecord = await Video.create({
            title,
            description,
            owner: userId,
            processingStatus: 'processing', // Keep track of the AI status
            originalFilePath: file.path // Or S3 URL if you move to cloud storage
        });
        */

      // MOCK ID for current testing without DB:
      const videoId = `vid_${Date.now()}`;

      // 3. Fire the file to the FastAPI Worker
      // This streams the file directly from /public/temp to port 8000
      const aiResponse = await ingestVideoForAI(videoId, file.path);

      // 4. Update Database on Success (Optional but recommended)
      /*
        await Video.findByIdAndUpdate(videoRecord._id, {
            processingStatus: 'completed',
            aiChunks: aiResponse.chunks_processed
        });
        */

      // 5. Return success to the client
      return res.status(200).json(
        // Replace with your ApiResponse wrapper if you use one
        {
          status: 200,
          message: 'Video successfully ingested by AI',
          data: {
            videoId: videoId, // Or videoRecord._id
            ai_details: aiResponse,
          },
        }
      );
    } catch (error: any) {
      // If the AI worker fails or times out, update the DB status
      /*
        if (videoRecord) {
            await Video.findByIdAndUpdate(videoRecord._id, { processingStatus: 'failed' });
        }
        */
      throw new ApiError(
        500,
        error?.message || 'AI Processing failed during ingestion'
      );
    } finally {
      // 6. THE JANITOR (Critical Server Maintenance)
      // This block runs no matter what happens above. It ensures your hard drive never fills up.
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`[Cleanup] Deleted temp file: ${file.path}`);
        } catch (cleanupError) {
          console.error(
            `[Fatal Cleanup Error] Failed to delete ${file.path}`,
            cleanupError
          );
        }
      }
    }
  }
);

export const askVideoQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const { video_id, question } = req.body;
    const videoMeta = await prisma.video.findUnique({
      where: { id: video_id },
      select: { title: true, description: true },
    });

    if (!video_id || !question) {
      throw new ApiError(400, 'Both video_id and question are required');
    }

    try {
      // Call the service that hits your FastAPI /ask endpoint
      const answerData = await askAiAboutVideo(video_id, question, videoMeta);

      return res.status(200).json({
        status: 200,
        message: 'AI generated an answer',
        data: answerData,
      });
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || 'Failed to retrieve answer from AI Worker'
      );
    }
  }
);
