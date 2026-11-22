import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { isWorkerHealthy } from '../services/ai.service.js';

const isDatabaseHealthy = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

// 200 only when the API can reach both the database and the AI worker
const healthcheck = asyncHandler(async (req, res) => {
  const [database, aiWorker] = await Promise.all([
    isDatabaseHealthy(),
    isWorkerHealthy(),
  ]);

  const healthy = database && aiWorker;
  const statusCode = healthy ? 200 : 503;
  const checks = {
    database: database ? 'up' : 'down',
    aiWorker: aiWorker ? 'up' : 'down',
  };

  return res
    .status(statusCode)
    .json(
      new ApiResponse(
        statusCode,
        { status: healthy ? 'OK' : 'DEGRADED', checks },
        healthy ? 'Health check passed' : 'One or more dependencies are down'
      )
    );
});

export { healthcheck };
